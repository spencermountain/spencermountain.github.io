var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* portfolio/components/Img.svelte generated by Svelte v3.22.2 */

    const file = "portfolio/components/Img.svelte";

    // (25:2) {:else}
    function create_else_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*caption*/ ctx[1]);
    			set_style(img, "width", /*width*/ ctx[3]);
    			set_style(img, "margin-bottom", "0px");
    			add_location(img, file, 25, 4, 445);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*src*/ 1 && img.src !== (img_src_value = /*src*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*caption*/ 2) {
    				attr_dev(img, "alt", /*caption*/ ctx[1]);
    			}

    			if (dirty & /*width*/ 8) {
    				set_style(img, "width", /*width*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(25:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:2) {#if link}
    function create_if_block(ctx) {
    	let a;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			img = element("img");
    			if (img.src !== (img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*caption*/ ctx[1]);
    			set_style(img, "width", /*width*/ ctx[3]);
    			set_style(img, "margin-bottom", "0px");
    			add_location(img, file, 22, 6, 352);
    			attr_dev(a, "href", /*link*/ ctx[2]);
    			attr_dev(a, "class", "link svelte-11my378");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file, 21, 4, 301);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*src*/ 1 && img.src !== (img_src_value = /*src*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*caption*/ 2) {
    				attr_dev(img, "alt", /*caption*/ ctx[1]);
    			}

    			if (dirty & /*width*/ 8) {
    				set_style(img, "width", /*width*/ ctx[3]);
    			}

    			if (dirty & /*link*/ 4) {
    				attr_dev(a, "href", /*link*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(21:2) {#if link}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let t;
    	let div0;

    	function select_block_type(ctx, dirty) {
    		if (/*link*/ ctx[2]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if_block.c();
    			t = space();
    			div0 = element("div");
    			attr_dev(div0, "class", "caption svelte-11my378");
    			add_location(div0, file, 27, 2, 525);
    			attr_dev(div1, "class", "container svelte-11my378");
    			add_location(div1, file, 19, 0, 260);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			div0.innerHTML = /*caption*/ ctx[1];
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, t);
    				}
    			}

    			if (dirty & /*caption*/ 2) div0.innerHTML = /*caption*/ ctx[1];		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { src = "" } = $$props;
    	let { caption = "" } = $$props;
    	let { link = "" } = $$props;
    	let { width = "100%" } = $$props;
    	const writable_props = ["src", "caption", "link", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Img> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Img", $$slots, []);

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("caption" in $$props) $$invalidate(1, caption = $$props.caption);
    		if ("link" in $$props) $$invalidate(2, link = $$props.link);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    	};

    	$$self.$capture_state = () => ({ src, caption, link, width });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("caption" in $$props) $$invalidate(1, caption = $$props.caption);
    		if ("link" in $$props) $$invalidate(2, link = $$props.link);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, caption, link, width];
    }

    class Img extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { src: 0, caption: 1, link: 2, width: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Img",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get src() {
    		throw new Error("<Img>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<Img>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get caption() {
    		throw new Error("<Img>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set caption(value) {
    		throw new Error("<Img>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get link() {
    		throw new Error("<Img>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set link(value) {
    		throw new Error("<Img>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Img>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Img>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* portfolio/components/Mov.svelte generated by Svelte v3.22.2 */

    const file$1 = "portfolio/components/Mov.svelte";

    // (28:2) {:else}
    function create_else_block$1(ctx) {
    	let video;
    	let video_src_value;

    	const block = {
    		c: function create() {
    			video = element("video");
    			set_style(video, "width", /*width*/ ctx[3]);
    			set_style(video, "margin-bottom", "0px");
    			if (video.src !== (video_src_value = /*src*/ ctx[0])) attr_dev(video, "src", video_src_value);
    			video.autoplay = true;
    			attr_dev(video, "mute", "");
    			video.loop = true;
    			attr_dev(video, "class", "svelte-1k0auip");
    			add_location(video, file$1, 28, 4, 487);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, video, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*width*/ 8) {
    				set_style(video, "width", /*width*/ ctx[3]);
    			}

    			if (dirty & /*src*/ 1 && video.src !== (video_src_value = /*src*/ ctx[0])) {
    				attr_dev(video, "src", video_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(video);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(28:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (24:2) {#if link}
    function create_if_block$1(ctx) {
    	let a;
    	let video;
    	let video_src_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			video = element("video");
    			set_style(video, "width", /*width*/ ctx[3]);
    			set_style(video, "margin-bottom", "0px");
    			if (video.src !== (video_src_value = /*src*/ ctx[0])) attr_dev(video, "src", video_src_value);
    			video.autoplay = true;
    			attr_dev(video, "mute", "");
    			video.loop = true;
    			attr_dev(video, "class", "svelte-1k0auip");
    			add_location(video, file$1, 25, 6, 387);
    			attr_dev(a, "href", /*link*/ ctx[2]);
    			attr_dev(a, "class", "link svelte-1k0auip");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$1, 24, 4, 336);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, video);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*width*/ 8) {
    				set_style(video, "width", /*width*/ ctx[3]);
    			}

    			if (dirty & /*src*/ 1 && video.src !== (video_src_value = /*src*/ ctx[0])) {
    				attr_dev(video, "src", video_src_value);
    			}

    			if (dirty & /*link*/ 4) {
    				attr_dev(a, "href", /*link*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(24:2) {#if link}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let t;
    	let div0;

    	function select_block_type(ctx, dirty) {
    		if (/*link*/ ctx[2]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			if_block.c();
    			t = space();
    			div0 = element("div");
    			attr_dev(div0, "class", "caption svelte-1k0auip");
    			add_location(div0, file$1, 30, 2, 574);
    			attr_dev(div1, "class", "container svelte-1k0auip");
    			add_location(div1, file$1, 22, 0, 295);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			div0.innerHTML = /*caption*/ ctx[1];
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div1, t);
    				}
    			}

    			if (dirty & /*caption*/ 2) div0.innerHTML = /*caption*/ ctx[1];		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { src = "" } = $$props;
    	let { caption = "" } = $$props;
    	let { link = "" } = $$props;
    	let { width = "100%" } = $$props;
    	const writable_props = ["src", "caption", "link", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Mov> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Mov", $$slots, []);

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("caption" in $$props) $$invalidate(1, caption = $$props.caption);
    		if ("link" in $$props) $$invalidate(2, link = $$props.link);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    	};

    	$$self.$capture_state = () => ({ src, caption, link, width });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(0, src = $$props.src);
    		if ("caption" in $$props) $$invalidate(1, caption = $$props.caption);
    		if ("link" in $$props) $$invalidate(2, link = $$props.link);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [src, caption, link, width];
    }

    class Mov extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { src: 0, caption: 1, link: 2, width: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Mov",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get src() {
    		throw new Error("<Mov>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set src(value) {
    		throw new Error("<Mov>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get caption() {
    		throw new Error("<Mov>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set caption(value) {
    		throw new Error("<Mov>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get link() {
    		throw new Error("<Mov>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set link(value) {
    		throw new Error("<Mov>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Mov>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Mov>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* portfolio/components/Youtube.svelte generated by Svelte v3.22.2 */

    const file$2 = "portfolio/components/Youtube.svelte";

    function create_fragment$2(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let t1;
    	let div2;
    	let div1;
    	let t2;
    	let div4;
    	let iframe;
    	let iframe_src_value;
    	let t3;
    	let div5;
    	let raw1_value = (/*bottom*/ ctx[3] || /*caption*/ ctx[5]) + "";

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text(/*title*/ ctx[4]);
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t2 = space();
    			div4 = element("div");
    			iframe = element("iframe");
    			t3 = space();
    			div5 = element("div");
    			attr_dev(div0, "class", "mb1 svelte-1ky7f12");
    			set_style(div0, "border-bottom", "3px solid " + /*color*/ ctx[1]);
    			add_location(div0, file$2, 53, 2, 914);
    			attr_dev(div1, "class", "right gap svelte-1ky7f12");
    			add_location(div1, file$2, 55, 4, 1011);
    			attr_dev(div2, "class", "mt2 svelte-1ky7f12");
    			add_location(div2, file$2, 54, 2, 989);
    			attr_dev(div3, "class", "row svelte-1ky7f12");
    			add_location(div3, file$2, 52, 0, 894);
    			attr_dev(iframe, "title", /*title*/ ctx[4]);
    			attr_dev(iframe, "class", "frame svelte-1ky7f12");
    			attr_dev(iframe, "width", "672");
    			attr_dev(iframe, "height", "378");
    			if (iframe.src !== (iframe_src_value = "https://www.youtube-nocookie.com/embed/" + /*video*/ ctx[0])) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file$2, 61, 2, 1118);
    			attr_dev(div4, "class", "gap embed-container svelte-1ky7f12");
    			add_location(div4, file$2, 60, 0, 1082);
    			attr_dev(div5, "class", "right gap svelte-1ky7f12");
    			add_location(div5, file$2, 70, 0, 1296);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			div1.innerHTML = /*right*/ ctx[2];
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, iframe);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div5, anchor);
    			div5.innerHTML = raw1_value;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 16) set_data_dev(t0, /*title*/ ctx[4]);

    			if (dirty & /*color*/ 2) {
    				set_style(div0, "border-bottom", "3px solid " + /*color*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) div1.innerHTML = /*right*/ ctx[2];
    			if (dirty & /*title*/ 16) {
    				attr_dev(iframe, "title", /*title*/ ctx[4]);
    			}

    			if (dirty & /*video*/ 1 && iframe.src !== (iframe_src_value = "https://www.youtube-nocookie.com/embed/" + /*video*/ ctx[0])) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}

    			if (dirty & /*bottom, caption*/ 40 && raw1_value !== (raw1_value = (/*bottom*/ ctx[3] || /*caption*/ ctx[5]) + "")) div5.innerHTML = raw1_value;		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { video = "" } = $$props;
    	let { color = "steelblue" } = $$props;
    	let { right = "" } = $$props;
    	let { bottom = "" } = $$props;
    	let { title = "" } = $$props;
    	let { caption = "" } = $$props;
    	const writable_props = ["video", "color", "right", "bottom", "title", "caption"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Youtube> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Youtube", $$slots, []);

    	$$self.$set = $$props => {
    		if ("video" in $$props) $$invalidate(0, video = $$props.video);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("right" in $$props) $$invalidate(2, right = $$props.right);
    		if ("bottom" in $$props) $$invalidate(3, bottom = $$props.bottom);
    		if ("title" in $$props) $$invalidate(4, title = $$props.title);
    		if ("caption" in $$props) $$invalidate(5, caption = $$props.caption);
    	};

    	$$self.$capture_state = () => ({
    		video,
    		color,
    		right,
    		bottom,
    		title,
    		caption
    	});

    	$$self.$inject_state = $$props => {
    		if ("video" in $$props) $$invalidate(0, video = $$props.video);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("right" in $$props) $$invalidate(2, right = $$props.right);
    		if ("bottom" in $$props) $$invalidate(3, bottom = $$props.bottom);
    		if ("title" in $$props) $$invalidate(4, title = $$props.title);
    		if ("caption" in $$props) $$invalidate(5, caption = $$props.caption);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [video, color, right, bottom, title, caption];
    }

    class Youtube extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			video: 0,
    			color: 1,
    			right: 2,
    			bottom: 3,
    			title: 4,
    			caption: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Youtube",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get video() {
    		throw new Error("<Youtube>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set video(value) {
    		throw new Error("<Youtube>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Youtube>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Youtube>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get right() {
    		throw new Error("<Youtube>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set right(value) {
    		throw new Error("<Youtube>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Youtube>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Youtube>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Youtube>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Youtube>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get caption() {
    		throw new Error("<Youtube>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set caption(value) {
    		throw new Error("<Youtube>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* portfolio/components/Hr.svelte generated by Svelte v3.22.2 */

    const file$3 = "portfolio/components/Hr.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let t0;
    	let t1;
    	let hr;
    	let t2;
    	let div1;
    	let t3;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(/*text*/ ctx[0]);
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			div1 = element("div");
    			t3 = text(/*bottom*/ ctx[1]);
    			attr_dev(div0, "class", "text svelte-1nuzgn5");
    			add_location(div0, file$3, 24, 2, 345);
    			attr_dev(hr, "class", "hr svelte-1nuzgn5");
    			add_location(hr, file$3, 25, 2, 378);
    			attr_dev(div1, "class", "text svelte-1nuzgn5");
    			add_location(div1, file$3, 26, 2, 398);
    			attr_dev(div2, "class", "container svelte-1nuzgn5");
    			add_location(div2, file$3, 23, 0, 319);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, hr);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) set_data_dev(t0, /*text*/ ctx[0]);
    			if (dirty & /*bottom*/ 2) set_data_dev(t3, /*bottom*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { text = "" } = $$props;
    	let { bottom = "" } = $$props;
    	const writable_props = ["text", "bottom"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Hr> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Hr", $$slots, []);

    	$$self.$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("bottom" in $$props) $$invalidate(1, bottom = $$props.bottom);
    	};

    	$$self.$capture_state = () => ({ text, bottom });

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    		if ("bottom" in $$props) $$invalidate(1, bottom = $$props.bottom);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text, bottom];
    }

    class Hr extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { text: 0, bottom: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Hr",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get text() {
    		throw new Error("<Hr>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Hr>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Hr>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Hr>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* portfolio/components/Vimeo.svelte generated by Svelte v3.22.2 */

    const file$4 = "portfolio/components/Vimeo.svelte";

    function create_fragment$4(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let t1;
    	let div2;
    	let div1;
    	let t2;
    	let div4;
    	let iframe;
    	let iframe_src_value;
    	let t3;
    	let div5;
    	let raw1_value = (/*bottom*/ ctx[3] || /*caption*/ ctx[5]) + "";

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text(/*title*/ ctx[4]);
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t2 = space();
    			div4 = element("div");
    			iframe = element("iframe");
    			t3 = space();
    			div5 = element("div");
    			attr_dev(div0, "class", "mb1 svelte-1ky7f12");
    			set_style(div0, "border-bottom", "3px solid " + /*color*/ ctx[1]);
    			add_location(div0, file$4, 53, 2, 914);
    			attr_dev(div1, "class", "right gap svelte-1ky7f12");
    			add_location(div1, file$4, 55, 4, 1011);
    			attr_dev(div2, "class", "mt2 svelte-1ky7f12");
    			add_location(div2, file$4, 54, 2, 989);
    			attr_dev(div3, "class", "row svelte-1ky7f12");
    			add_location(div3, file$4, 52, 0, 894);
    			attr_dev(iframe, "title", /*title*/ ctx[4]);
    			attr_dev(iframe, "class", "frame svelte-1ky7f12");
    			attr_dev(iframe, "width", "672");
    			attr_dev(iframe, "height", "378");
    			if (iframe.src !== (iframe_src_value = "https://player.vimeo.com/video/" + /*video*/ ctx[0] + "?byline=0&portrait=0")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "frameborder", "0");
    			iframe.allowFullscreen = true;
    			add_location(iframe, file$4, 61, 2, 1118);
    			attr_dev(div4, "class", "gap embed-container svelte-1ky7f12");
    			add_location(div4, file$4, 60, 0, 1082);
    			attr_dev(div5, "class", "right gap svelte-1ky7f12");
    			add_location(div5, file$4, 70, 0, 1308);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			div1.innerHTML = /*right*/ ctx[2];
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, iframe);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div5, anchor);
    			div5.innerHTML = raw1_value;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 16) set_data_dev(t0, /*title*/ ctx[4]);

    			if (dirty & /*color*/ 2) {
    				set_style(div0, "border-bottom", "3px solid " + /*color*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) div1.innerHTML = /*right*/ ctx[2];
    			if (dirty & /*title*/ 16) {
    				attr_dev(iframe, "title", /*title*/ ctx[4]);
    			}

    			if (dirty & /*video*/ 1 && iframe.src !== (iframe_src_value = "https://player.vimeo.com/video/" + /*video*/ ctx[0] + "?byline=0&portrait=0")) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}

    			if (dirty & /*bottom, caption*/ 40 && raw1_value !== (raw1_value = (/*bottom*/ ctx[3] || /*caption*/ ctx[5]) + "")) div5.innerHTML = raw1_value;		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div4);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { video = "" } = $$props;
    	let { color = "steelblue" } = $$props;
    	let { right = "" } = $$props;
    	let { bottom = "" } = $$props;
    	let { title = "" } = $$props;
    	let { caption = "" } = $$props;
    	const writable_props = ["video", "color", "right", "bottom", "title", "caption"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Vimeo> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Vimeo", $$slots, []);

    	$$self.$set = $$props => {
    		if ("video" in $$props) $$invalidate(0, video = $$props.video);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("right" in $$props) $$invalidate(2, right = $$props.right);
    		if ("bottom" in $$props) $$invalidate(3, bottom = $$props.bottom);
    		if ("title" in $$props) $$invalidate(4, title = $$props.title);
    		if ("caption" in $$props) $$invalidate(5, caption = $$props.caption);
    	};

    	$$self.$capture_state = () => ({
    		video,
    		color,
    		right,
    		bottom,
    		title,
    		caption
    	});

    	$$self.$inject_state = $$props => {
    		if ("video" in $$props) $$invalidate(0, video = $$props.video);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("right" in $$props) $$invalidate(2, right = $$props.right);
    		if ("bottom" in $$props) $$invalidate(3, bottom = $$props.bottom);
    		if ("title" in $$props) $$invalidate(4, title = $$props.title);
    		if ("caption" in $$props) $$invalidate(5, caption = $$props.caption);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [video, color, right, bottom, title, caption];
    }

    class Vimeo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			video: 0,
    			color: 1,
    			right: 2,
    			bottom: 3,
    			title: 4,
    			caption: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Vimeo",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get video() {
    		throw new Error("<Vimeo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set video(value) {
    		throw new Error("<Vimeo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Vimeo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Vimeo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get right() {
    		throw new Error("<Vimeo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set right(value) {
    		throw new Error("<Vimeo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Vimeo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Vimeo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Vimeo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Vimeo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get caption() {
    		throw new Error("<Vimeo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set caption(value) {
    		throw new Error("<Vimeo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* portfolio/build/Part.html generated by Svelte v3.22.2 */
    const file$5 = "portfolio/build/Part.html";

    function create_fragment$5(ctx) {
    	let div1;
    	let a0;
    	let div0;
    	let t1;
    	let i0;
    	let t3;
    	let div16;
    	let div15;
    	let h20;
    	let div5;
    	let div3;
    	let div2;
    	let div4;
    	let div6;
    	let iframe;
    	let iframe_src_value;
    	let div7;
    	let div8;
    	let div10;
    	let div9;
    	let div13;
    	let div11;
    	let div12;
    	let div14;
    	let div27;
    	let div26;
    	let h21;
    	let div19;
    	let div17;
    	let div18;
    	let ul0;
    	let t9;
    	let div20;
    	let t10;
    	let a1;
    	let t12;
    	let div21;
    	let div25;
    	let div24;
    	let div23;
    	let t13;
    	let div22;
    	let t14;
    	let a2;
    	let div39;
    	let div38;
    	let h22;
    	let div31;
    	let div28;
    	let div30;
    	let ul1;
    	let t17;
    	let div29;
    	let t18;
    	let a3;
    	let div36;
    	let div32;
    	let div35;
    	let div33;
    	let div34;
    	let div37;
    	let div47;
    	let div46;
    	let h23;
    	let div44;
    	let div42;
    	let div40;
    	let div41;
    	let div43;
    	let div45;
    	let t23;
    	let a4;
    	let div59;
    	let div58;
    	let h24;
    	let div51;
    	let div49;
    	let div48;
    	let div50;
    	let div52;
    	let div53;
    	let div57;
    	let div54;
    	let div56;
    	let div55;
    	let div65;
    	let div64;
    	let h25;
    	let div60;
    	let div62;
    	let div61;
    	let t28;
    	let a5;
    	let div63;
    	let div76;
    	let div75;
    	let h26;
    	let div66;
    	let div70;
    	let div67;
    	let div69;
    	let div68;
    	let ul2;
    	let t32;
    	let a6;
    	let div74;
    	let div71;
    	let div73;
    	let div72;
    	let div88;
    	let div87;
    	let h27;
    	let div79;
    	let div77;
    	let div78;
    	let div81;
    	let t35;
    	let div80;
    	let div82;
    	let t37;
    	let i1;
    	let div83;
    	let div86;
    	let div84;
    	let div85;
    	let div97;
    	let div96;
    	let h28;
    	let div93;
    	let div89;
    	let div92;
    	let div90;
    	let div91;
    	let t43;
    	let a7;
    	let div94;
    	let div95;
    	let div99;
    	let div98;
    	let h29;
    	let div106;
    	let div105;
    	let h210;
    	let div100;
    	let ul3;
    	let t48;
    	let i2;
    	let div101;
    	let div102;
    	let div103;
    	let div104;
    	let div109;
    	let div108;
    	let div107;
    	let img54;
    	let img54_src_value;
    	let ul20;
    	let li0;
    	let a8;
    	let ul4;
    	let li1;
    	let a9;
    	let ul5;
    	let li2;
    	let a10;
    	let ul6;
    	let li3;
    	let a11;
    	let ul7;
    	let li4;
    	let a12;
    	let ul8;
    	let li5;
    	let a13;
    	let ul9;
    	let li6;
    	let a14;
    	let ul10;
    	let li7;
    	let a15;
    	let ul11;
    	let li8;
    	let a16;
    	let ul12;
    	let li9;
    	let a17;
    	let ul13;
    	let li10;
    	let a18;
    	let ul14;
    	let li11;
    	let a19;
    	let ul15;
    	let li12;
    	let a20;
    	let ul16;
    	let li13;
    	let a21;
    	let ul17;
    	let li14;
    	let a22;
    	let ul18;
    	let li15;
    	let a23;
    	let ul19;
    	let div110;
    	let div111;
    	let current;

    	const img0 = new Img({
    			props: {
    				src: "./assets/2020/covid.png",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const mov0 = new Mov({
    			props: {
    				src: "./assets/2020/hand-computer.mp4",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img1 = new Img({
    			props: {
    				src: "./assets/2020/2020.jpg",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img2 = new Img({
    			props: {
    				src: "./assets/2020/skydome.png",
    				width: "200px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img3 = new Img({
    			props: {
    				src: "./assets/2020/fr-compromise.png",
    				width: "450px",
    				caption: "compromise-community begins<br/><i>french-language conjugation</i>"
    			},
    			$$inline: true
    		});

    	const mov1 = new Mov({
    			props: {
    				src: "./assets/2020/fast-mode.mp4",
    				width: "450px",
    				caption: "compromise became fast<br/><i>contract w/ <a href=\"https://moov.co/\">Moov.co</a></i>"
    			},
    			$$inline: true
    		});

    	const img4 = new Img({
    			props: {
    				src: "./assets/2020/wayne.png",
    				width: "150px"
    			},
    			$$inline: true
    		});

    	const img5 = new Img({
    			props: {
    				src: "./assets/2019/blender.jpg",
    				width: "175px"
    			},
    			$$inline: true
    		});

    	const img6 = new Img({
    			props: {
    				src: "./assets/2020/sport-season.png",
    				width: "250px"
    			},
    			$$inline: true
    		});

    	const img7 = new Img({
    			props: {
    				src: "./assets/2020/calendar.png",
    				width: "200px"
    			},
    			$$inline: true
    		});

    	const img8 = new Img({
    			props: {
    				src: "./assets/2020/gun-and-rose.png",
    				width: "350px"
    			},
    			$$inline: true
    		});

    	const img9 = new Img({
    			props: {
    				src: "./assets/2019/v12.png",
    				width: "380px"
    			},
    			$$inline: true
    		});

    	const img10 = new Img({
    			props: {
    				src: "./assets/2019/2019.jpg",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img11 = new Img({
    			props: {
    				src: "./assets/2019/dumps.png",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img12 = new Img({
    			props: {
    				src: "./assets/2019/globe.png",
    				width: "150px"
    			},
    			$$inline: true
    		});

    	const img13 = new Img({
    			props: {
    				src: "./assets/2019/twitter.png",
    				width: "380px"
    			},
    			$$inline: true
    		});

    	const img14 = new Img({
    			props: {
    				src: "./assets/2019/2019-2.jpg",
    				width: "120px"
    			},
    			$$inline: true
    		});

    	const img15 = new Img({
    			props: {
    				src: "./assets/2019/venngage.png",
    				width: "60px"
    			},
    			$$inline: true
    		});

    	const img16 = new Img({
    			props: {
    				src: "./assets/2018/geneology.png",
    				width: "450px",
    				caption: "did my genealogy. it was hard."
    			},
    			$$inline: true
    		});

    	const img17 = new Img({
    			props: {
    				src: "./assets/2018/cheese-maker.png",
    				width: "250px"
    			},
    			$$inline: true
    		});

    	const img18 = new Img({
    			props: {
    				src: "./assets/2018/mars.jpg",
    				width: "350px"
    			},
    			$$inline: true
    		});

    	const img19 = new Img({
    			props: {
    				src: "./assets/2018/begin-cli.gif",
    				width: "350px"
    			},
    			$$inline: true
    		});

    	const img20 = new Img({
    			props: {
    				src: "./assets/2018/spacetime.png",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img21 = new Img({
    			props: {
    				src: "./assets/2018/spacetime.gif",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img22 = new Img({
    			props: {
    				src: "./assets/2019/colors.png",
    				width: "280px"
    			},
    			$$inline: true
    		});

    	const hr0 = new Hr({ $$inline: true });

    	const img23 = new Img({
    			props: {
    				src: "./assets/2017/tests-failing.png",
    				width: "500px",
    				caption: "compromise v12"
    			},
    			$$inline: true
    		});

    	const img24 = new Img({
    			props: {
    				src: "./assets/2017/who-ordinal.png",
    				width: "350px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img25 = new Img({
    			props: {
    				src: "./assets/2017/2017.jpg",
    				width: "175px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img26 = new Img({
    			props: {
    				src: "./assets/2017/dumpster.gif",
    				width: "400px",
    				caption: "system for parsing wikipedia<br/>in-use at Wolfram Alpha"
    			},
    			$$inline: true
    		});

    	const img27 = new Img({
    			props: {
    				src: "./assets/2017/wtf-wikipedia.png",
    				width: "225px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img28 = new Img({
    			props: {
    				src: "./assets/2017/japan.jpg",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const hr1 = new Hr({ $$inline: true });

    	const img29 = new Img({
    			props: {
    				src: "./assets/2016/map.jpg",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img30 = new Img({
    			props: {
    				src: "./assets/2016/yonge-street.jpg",
    				width: "200px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img31 = new Img({
    			props: {
    				src: "./assets/2016/old.png",
    				width: "200px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img32 = new Img({
    			props: {
    				src: "./assets/2016/trending.jpg",
    				width: "500px"
    			},
    			$$inline: true
    		});

    	const youtube = new Youtube({
    			props: { video: "WuPVS2tCg8s" },
    			$$inline: true
    		});

    	const img33 = new Img({
    			props: {
    				src: "./assets/2016/montreal.png",
    				width: "200px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const hr2 = new Hr({ $$inline: true });

    	const img34 = new Img({
    			props: {
    				src: "./assets/2015/2015.jpg",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img35 = new Img({
    			props: {
    				src: "./assets/2015/toronto.jpg",
    				width: "250px",
    				caption: "moved to Toronto"
    			},
    			$$inline: true
    		});

    	const img36 = new Img({
    			props: {
    				src: "./assets/2017/govdna.png",
    				width: "450px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img37 = new Img({
    			props: {
    				src: "./assets/2015/govinvest2.jpg",
    				width: "300px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img38 = new Img({
    			props: {
    				src: "./assets/2015/playoffs.jpg",
    				width: "400px",
    				caption: "blue jays win ALDS<br/>but lose semi-final"
    			},
    			$$inline: true
    		});

    	const img39 = new Img({
    			props: {
    				src: "./assets/2014/gradschool.jpg",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img40 = new Img({
    			props: {
    				src: "./assets/2014/digraph-genealogy.jpg",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img41 = new Img({
    			props: {
    				src: "./assets/2014/state-patent.jpg",
    				width: "450px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img42 = new Img({
    			props: {
    				src: "./assets/2014/earthbarely1.jpg",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img43 = new Img({
    			props: {
    				src: "./assets/2014/earthbarely2.jpg",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img44 = new Img({
    			props: {
    				src: "./assets/2013/london.jpg",
    				width: "350px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img45 = new Img({
    			props: {
    				src: "./assets/2013/2013.png",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img46 = new Img({
    			props: {
    				src: "./assets/2013/Tree.png",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img47 = new Img({
    			props: {
    				src: "./assets/2013/alex-techcrunch.png",
    				width: "350px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img48 = new Img({
    			props: {
    				src: "./assets/2013/deceased-persons.png",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img49 = new Img({
    			props: {
    				src: "./assets/2013/mturk.jpg",
    				width: "320px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img50 = new Img({
    			props: {
    				src: "./assets/2012/london.jpg",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img51 = new Img({
    			props: {
    				src: "./assets/2012/opinion.png",
    				width: "300px",
    				caption: "<i >london in the rain in beautiful</i>"
    			},
    			$$inline: true
    		});

    	const img52 = new Img({
    			props: {
    				src: "./assets/2012/mars.jpg",
    				width: "550px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const vimeo = new Vimeo({
    			props: {
    				title: "Freebase + Ubiquity",
    				video: "13992710"
    			},
    			$$inline: true
    		});

    	const img53 = new Img({
    			props: {
    				src: "./assets/2010/simple.jpg",
    				width: "450px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const hr3 = new Hr({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "〱 ";
    			div0 = element("div");
    			t1 = text("spencer kelly ");
    			i0 = element("i");
    			i0.textContent = "is just trying his best";
    			t3 = text(".");
    			div16 = element("div");
    			div15 = element("div");
    			h20 = element("h2");
    			h20.textContent = "2020";
    			div5 = element("div");
    			div3 = element("div");
    			create_component(img0.$$.fragment);
    			div2 = element("div");
    			div2.textContent = "Covid-19 is the bummer";
    			div4 = element("div");
    			create_component(mov0.$$.fragment);
    			create_component(img1.$$.fragment);
    			create_component(img2.$$.fragment);
    			div6 = element("div");
    			create_component(img3.$$.fragment);
    			iframe = element("iframe");
    			div7 = element("div");
    			div7.textContent = "Computer programming with Spencer Kelly";
    			div8 = element("div");
    			create_component(mov1.$$.fragment);
    			div10 = element("div");
    			div9 = element("div");
    			div9.textContent = "learning svelte + blender:";
    			div13 = element("div");
    			div11 = element("div");
    			create_component(img4.$$.fragment);
    			create_component(img5.$$.fragment);
    			div12 = element("div");
    			create_component(img6.$$.fragment);
    			create_component(img7.$$.fragment);
    			div14 = element("div");
    			create_component(img8.$$.fragment);
    			div27 = element("div");
    			div26 = element("div");
    			h21 = element("h2");
    			h21.textContent = "2019";
    			div19 = element("div");
    			div17 = element("div");
    			create_component(img9.$$.fragment);
    			div18 = element("div");
    			create_component(img10.$$.fragment);
    			create_component(img11.$$.fragment);
    			create_component(img12.$$.fragment);
    			ul0 = element("ul");
    			t9 = text("compromise running in the NHS");
    			div20 = element("div");
    			t10 = text("for ");
    			a1 = element("a");
    			a1.textContent = "MBI health";
    			t12 = text(".");
    			div21 = element("div");
    			create_component(img13.$$.fragment);
    			create_component(img14.$$.fragment);
    			div25 = element("div");
    			div24 = element("div");
    			div23 = element("div");
    			t13 = text("built a realtime layout solver");
    			div22 = element("div");
    			t14 = text("for ");
    			a2 = element("a");
    			a2.textContent = "venngage.com";
    			create_component(img15.$$.fragment);
    			div39 = element("div");
    			div38 = element("div");
    			h22 = element("h2");
    			h22.textContent = "2018";
    			div31 = element("div");
    			div28 = element("div");
    			create_component(img16.$$.fragment);
    			create_component(img17.$$.fragment);
    			div30 = element("div");
    			create_component(img18.$$.fragment);
    			create_component(img19.$$.fragment);
    			ul1 = element("ul");
    			t17 = text("wrote a date-parser for natural language");
    			div29 = element("div");
    			t18 = text("for ");
    			a3 = element("a");
    			a3.textContent = "begin.com";
    			div36 = element("div");
    			div32 = element("div");
    			create_component(img20.$$.fragment);
    			create_component(img21.$$.fragment);
    			div35 = element("div");
    			div33 = element("div");
    			div33.textContent = "made a timezone library";
    			div34 = element("div");
    			div34.textContent = "also hard.";
    			div37 = element("div");
    			create_component(img22.$$.fragment);
    			create_component(hr0.$$.fragment);
    			div47 = element("div");
    			div46 = element("div");
    			h23 = element("h2");
    			h23.textContent = "2017";
    			create_component(img23.$$.fragment);
    			div44 = element("div");
    			div42 = element("div");
    			create_component(img24.$$.fragment);
    			div40 = element("div");
    			create_component(img25.$$.fragment);
    			div41 = element("div");
    			create_component(img26.$$.fragment);
    			div43 = element("div");
    			create_component(img27.$$.fragment);
    			create_component(img28.$$.fragment);
    			div45 = element("div");
    			t23 = text("compromise being used ");
    			a4 = element("a");
    			a4.textContent = "at the United Nations";
    			create_component(hr1.$$.fragment);
    			div59 = element("div");
    			div58 = element("div");
    			h24 = element("h2");
    			h24.textContent = "2016";
    			div51 = element("div");
    			div49 = element("div");
    			create_component(img29.$$.fragment);
    			div48 = element("div");
    			create_component(img30.$$.fragment);
    			div50 = element("div");
    			create_component(img31.$$.fragment);
    			div52 = element("div");
    			create_component(img32.$$.fragment);
    			div53 = element("div");
    			create_component(youtube.$$.fragment);
    			div57 = element("div");
    			div54 = element("div");
    			div56 = element("div");
    			div55 = element("div");
    			create_component(img33.$$.fragment);
    			create_component(hr2.$$.fragment);
    			div65 = element("div");
    			div64 = element("div");
    			h25 = element("h2");
    			h25.textContent = "2015";
    			create_component(img34.$$.fragment);
    			create_component(img35.$$.fragment);
    			div60 = element("div");
    			div60.textContent = "pension vizualization dashboard";
    			create_component(img36.$$.fragment);
    			div62 = element("div");
    			create_component(img37.$$.fragment);
    			div61 = element("div");
    			t28 = text("for ");
    			a5 = element("a");
    			a5.textContent = "govInvest";
    			div63 = element("div");
    			create_component(img38.$$.fragment);
    			div76 = element("div");
    			div75 = element("div");
    			h26 = element("h2");
    			h26.textContent = "2014";
    			div66 = element("div");
    			div66.textContent = "went to grad school for a short time.";
    			div70 = element("div");
    			div67 = element("div");
    			create_component(img39.$$.fragment);
    			div69 = element("div");
    			div68 = element("div");
    			create_component(img40.$$.fragment);
    			ul2 = element("ul");
    			t32 = text("granted this weird software patent");
    			a6 = element("a");
    			create_component(img41.$$.fragment);
    			div74 = element("div");
    			div71 = element("div");
    			create_component(img42.$$.fragment);
    			div73 = element("div");
    			create_component(img43.$$.fragment);
    			div72 = element("div");
    			div72.textContent = "CUSEC14 hackathon finalist";
    			div88 = element("div");
    			div87 = element("div");
    			h27 = element("h2");
    			h27.textContent = "2013";
    			div79 = element("div");
    			div77 = element("div");
    			create_component(img44.$$.fragment);
    			div78 = element("div");
    			create_component(img45.$$.fragment);
    			create_component(img46.$$.fragment);
    			div81 = element("div");
    			t35 = text("state.com hires 45 people");
    			div80 = element("div");
    			div80.textContent = "all will be laid-off the next year.";
    			create_component(img47.$$.fragment);
    			div82 = element("div");
    			t37 = text("webby nomination - ");
    			i1 = element("i");
    			i1.textContent = "best community, 2013";
    			div83 = element("div");
    			create_component(img48.$$.fragment);
    			create_component(img49.$$.fragment);
    			div86 = element("div");
    			div84 = element("div");
    			div84.textContent = "Freebase shuts-down.";
    			div85 = element("div");
    			div85.textContent = "React and D3 are both created.";
    			div97 = element("div");
    			div96 = element("div");
    			h28 = element("h2");
    			h28.textContent = "2012";
    			div93 = element("div");
    			div89 = element("div");
    			create_component(img50.$$.fragment);
    			div92 = element("div");
    			div90 = element("div");
    			div90.textContent = "moved to London";
    			div91 = element("div");
    			t43 = text("for ");
    			a7 = element("a");
    			a7.textContent = "State.com";
    			div94 = element("div");
    			create_component(img51.$$.fragment);
    			div95 = element("div");
    			create_component(img52.$$.fragment);
    			div99 = element("div");
    			div98 = element("div");
    			h29 = element("h2");
    			h29.textContent = "2011";
    			create_component(vimeo.$$.fragment);
    			div106 = element("div");
    			div105 = element("div");
    			h210 = element("h2");
    			h210.textContent = "2010";
    			div100 = element("div");
    			div100.textContent = "English Text simplification";
    			create_component(img53.$$.fragment);
    			ul3 = element("ul");
    			t48 = text("often cited as ");
    			i2 = element("i");
    			i2.textContent = "'the most naive' simplification of english";
    			div101 = element("div");
    			div101.textContent = "in many papers, somehow.";
    			div102 = element("div");
    			div102.textContent = "wikipedia bot";
    			div103 = element("div");
    			div103.textContent = "accepted on en.wikipedia";
    			div104 = element("div");
    			div104.textContent = "filled-in missing citation data until 2012.";
    			create_component(hr3.$$.fragment);
    			div109 = element("div");
    			div108 = element("div");
    			div107 = element("div");
    			div107.textContent = "citations:";
    			img54 = element("img");
    			ul20 = element("ul");
    			li0 = element("li");
    			a8 = element("a");
    			a8.textContent = "TensorFlow.js: Machine Learning for the Web and Beyond";
    			ul4 = element("ul");
    			ul4.textContent = "Google. 2019.";
    			li1 = element("li");
    			a9 = element("a");
    			a9.textContent = "Development of a web application for an automated user assistant";
    			ul5 = element("ul");
    			ul5.textContent = "the International Helenic University. 2018.";
    			li2 = element("li");
    			a10 = element("a");
    			a10.textContent = "Pronunciation Scaffolder: Annotation accuracy";
    			ul6 = element("ul");
    			ul6.textContent = "University of Aizu, Japan. 2018.";
    			li3 = element("li");
    			a11 = element("a");
    			a11.textContent = "Authentication Using Dynamic Question Generation";
    			ul7 = element("ul");
    			ul7.textContent = "Somaiya College OF Engineering, Mumbai. 2018.";
    			li4 = element("li");
    			a12 = element("a");
    			a12.textContent = "NETANOS - Named entity-based Text Anonymization for Open Science";
    			ul8 = element("ul");
    			ul8.textContent = "University of Amsterdam. 2017.";
    			li5 = element("li");
    			a13 = element("a");
    			a13.textContent = "Visualization of Thesaurus-Based Web Search";
    			ul9 = element("ul");
    			ul9.textContent = "Vienna University of Technology. 2017.";
    			li6 = element("li");
    			a14 = element("a");
    			a14.textContent = "Web Apps Come of Age for Molecular Sciences";
    			ul10 = element("ul");
    			ul10.textContent = "Swiss Federal Institute of Technology. 2017.";
    			li7 = element("li");
    			a15 = element("a");
    			a15.textContent = "Martello.io whitepaper";
    			ul11 = element("ul");
    			ul11.textContent = "National College of Ireland. 2017.";
    			li8 = element("li");
    			a16 = element("a");
    			a16.textContent = "Wikipedia graph data retrieval";
    			ul12 = element("ul");
    			ul12.textContent = "University of West Bohemia. 2016";
    			li9 = element("li");
    			a17 = element("a");
    			a17.textContent = "New Data-Driven Approaches to Text Simplification";
    			ul13 = element("ul");
    			ul13.textContent = "University of Wolverhampton. 2015.";
    			li10 = element("li");
    			a18 = element("a");
    			a18.textContent = "Learning to Simplify Children Stories with Limited Data";
    			ul14 = element("ul");
    			ul14.textContent = "Vietnam National University. 2014.";
    			li11 = element("li");
    			a19 = element("a");
    			a19.textContent = "SimpLe: Lexical Simplification using Word Sense Disambiguation";
    			ul15 = element("ul");
    			ul15.textContent = "York University, Toronto. 2013.";
    			li12 = element("li");
    			a20 = element("a");
    			a20.textContent = "WikiSimple: Automatic Simplification of Wikipedia Articles";
    			ul16 = element("ul");
    			ul16.textContent = "University of Edinburgh. 2011.";
    			li13 = element("li");
    			a21 = element("a");
    			a21.textContent = "Learning to Simplify Sentences with Quasi-Synchronous Grammar and Integer Programming";
    			ul17 = element("ul");
    			ul17.textContent = "University of Edinburgh. 2011";
    			li14 = element("li");
    			a22 = element("a");
    			a22.textContent = "The future of Search";
    			ul18 = element("ul");
    			ul18.textContent = "UC Berkeley. 2010.";
    			li15 = element("li");
    			a23 = element("a");
    			a23.textContent = "Unsupervised extraction of lexical simplifications Wikipedia";
    			ul19 = element("ul");
    			ul19.textContent = "Cornell. 2010.";
    			div110 = element("div");
    			div111 = element("div");
    			attr_dev(a0, "class", "cursor");
    			attr_dev(a0, "href", "../");
    			set_style(a0, "border-bottom", "1px solid transparent");
    			add_location(a0, file$5, 6, 68, 375);
    			add_location(i0, file$5, 6, 172, 479);
    			add_location(div0, file$5, 6, 153, 460);
    			attr_dev(div1, "class", "mono f08 row i svelte-17l854g");
    			set_style(div1, "justify-content", "left");
    			add_location(div1, file$5, 6, 9, 316);
    			add_location(h20, file$5, 6, 265, 572);
    			attr_dev(div2, "class", "f06 tab2 mono grey right orange svelte-17l854g");
    			add_location(div2, file$5, 6, 379, 686);
    			attr_dev(div3, "class", "half");
    			add_location(div3, file$5, 6, 295, 602);
    			attr_dev(div4, "class", "half");
    			add_location(div4, file$5, 6, 458, 765);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$5, 6, 278, 585);
    			attr_dev(div6, "class", "m4");
    			add_location(div6, file$5, 6, 695, 1002);
    			attr_dev(iframe, "title", "Computer Programming with Spencer Kelly");
    			set_style(iframe, "border", "solid 1px #dedede");
    			set_style(iframe, "margin-top", "60px");
    			if (iframe.src !== (iframe_src_value = "https://app.stitcher.com/splayer/f/502426/68480006")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "350");
    			attr_dev(iframe, "height", "100");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "scrolling", "no");
    			add_location(iframe, file$5, 6, 876, 1183);
    			attr_dev(div7, "class", "tab i f09");
    			add_location(div7, file$5, 6, 1106, 1413);
    			attr_dev(div8, "class", "mt4");
    			add_location(div8, file$5, 6, 1174, 1481);
    			attr_dev(div9, "class", "tab i f09");
    			add_location(div9, file$5, 6, 1408, 1715);
    			attr_dev(div10, "class", "mt5");
    			add_location(div10, file$5, 6, 1391, 1698);
    			attr_dev(div11, "class", "half");
    			add_location(div11, file$5, 6, 1486, 1793);
    			attr_dev(div12, "class", "half");
    			add_location(div12, file$5, 6, 1622, 1929);
    			attr_dev(div13, "class", "row");
    			add_location(div13, file$5, 6, 1469, 1776);
    			attr_dev(div14, "class", "mt5");
    			add_location(div14, file$5, 6, 1772, 2079);
    			attr_dev(div15, "class", "year");
    			attr_dev(div15, "id", "2020");
    			add_location(div15, file$5, 6, 237, 544);
    			attr_dev(div16, "class", "main mt3");
    			add_location(div16, file$5, 6, 215, 522);
    			add_location(h21, file$5, 6, 1919, 2226);
    			attr_dev(div17, "class", "half");
    			add_location(div17, file$5, 6, 1949, 2256);
    			attr_dev(div18, "class", "half");
    			add_location(div18, file$5, 6, 2026, 2333);
    			attr_dev(div19, "class", "row");
    			add_location(div19, file$5, 6, 1932, 2239);
    			attr_dev(a1, "href", "http://mbihealthgroup.com/");
    			add_location(a1, file$5, 6, 2313, 2620);
    			attr_dev(div20, "class", "tab f09");
    			add_location(div20, file$5, 6, 2288, 2595);
    			attr_dev(ul0, "class", "i m4");
    			add_location(ul0, file$5, 6, 2242, 2549);
    			attr_dev(div21, "class", "row mt4");
    			add_location(div21, file$5, 6, 2376, 2683);
    			attr_dev(a2, "href", "https://venngage.com/");
    			add_location(a2, file$5, 6, 2649, 2956);
    			attr_dev(div22, "class", "tab f09");
    			add_location(div22, file$5, 6, 2624, 2931);
    			attr_dev(div23, "class", "i");
    			add_location(div23, file$5, 6, 2579, 2886);
    			add_location(div24, file$5, 6, 2574, 2881);
    			attr_dev(div25, "class", "tab row mt3");
    			set_style(div25, "justify-content", "normal");
    			add_location(div25, file$5, 6, 2516, 2823);
    			attr_dev(div26, "class", "year");
    			attr_dev(div26, "id", "2019");
    			add_location(div26, file$5, 6, 1891, 2198);
    			attr_dev(div27, "class", "main mt4");
    			add_location(div27, file$5, 6, 1869, 2176);
    			add_location(h22, file$5, 6, 2840, 3147);
    			attr_dev(div28, "class", "half");
    			add_location(div28, file$5, 6, 2870, 3177);
    			attr_dev(a3, "href", "https://begin.com");
    			add_location(a3, file$5, 6, 3258, 3565);
    			attr_dev(div29, "class", "i tab f09");
    			add_location(div29, file$5, 6, 3231, 3538);
    			add_location(ul1, file$5, 6, 3187, 3494);
    			attr_dev(div30, "class", "half");
    			add_location(div30, file$5, 6, 3056, 3363);
    			attr_dev(div31, "class", "row");
    			add_location(div31, file$5, 6, 2853, 3160);
    			attr_dev(div32, "class", "half");
    			add_location(div32, file$5, 6, 3343, 3650);
    			add_location(div33, file$5, 6, 3525, 3832);
    			attr_dev(div34, "class", "i");
    			add_location(div34, file$5, 6, 3559, 3866);
    			attr_dev(div35, "class", "half");
    			add_location(div35, file$5, 6, 3507, 3814);
    			attr_dev(div36, "class", "row mt4");
    			add_location(div36, file$5, 6, 3322, 3629);
    			attr_dev(div37, "class", "tab2");
    			add_location(div37, file$5, 6, 3602, 3909);
    			attr_dev(div38, "class", "year");
    			attr_dev(div38, "id", "2018");
    			add_location(div38, file$5, 6, 2812, 3119);
    			attr_dev(div39, "class", "main mt4");
    			add_location(div39, file$5, 6, 2790, 3097);
    			add_location(h23, file$5, 6, 3753, 4060);
    			attr_dev(div40, "class", "mt2");
    			add_location(div40, file$5, 6, 3965, 4272);
    			attr_dev(div41, "class", "mt3");
    			add_location(div41, file$5, 6, 4053, 4360);
    			attr_dev(div42, "class", "half");
    			add_location(div42, file$5, 6, 3875, 4182);
    			attr_dev(div43, "class", "half");
    			add_location(div43, file$5, 6, 4214, 4521);
    			attr_dev(div44, "class", "row mt3");
    			add_location(div44, file$5, 6, 3854, 4161);
    			attr_dev(a4, "href", "https://devblogs.microsoft.com/cse/2017/06/06/geocoding-social-conversations-nlp-javascript/");
    			add_location(a4, file$5, 6, 4427, 4734);
    			attr_dev(div45, "class", "mt5 ml3");
    			add_location(div45, file$5, 6, 4384, 4691);
    			attr_dev(div46, "class", "year");
    			attr_dev(div46, "id", "2017");
    			add_location(div46, file$5, 6, 3725, 4032);
    			attr_dev(div47, "class", "main mt5");
    			add_location(div47, file$5, 6, 3703, 4010);
    			add_location(h24, file$5, 6, 4632, 4939);
    			attr_dev(div48, "class", "mt2");
    			add_location(div48, file$5, 6, 4744, 5051);
    			attr_dev(div49, "class", "half");
    			add_location(div49, file$5, 6, 4662, 4969);
    			attr_dev(div50, "class", "half");
    			add_location(div50, file$5, 6, 4846, 5153);
    			attr_dev(div51, "class", "row");
    			add_location(div51, file$5, 6, 4645, 4952);
    			attr_dev(div52, "class", "mt3");
    			add_location(div52, file$5, 6, 4940, 5247);
    			attr_dev(div53, "class", "mt3");
    			add_location(div53, file$5, 6, 5021, 5328);
    			attr_dev(div54, "class", "half");
    			add_location(div54, file$5, 6, 5107, 5414);
    			attr_dev(div55, "class", "mt3");
    			add_location(div55, file$5, 6, 5149, 5456);
    			attr_dev(div56, "class", "half");
    			add_location(div56, file$5, 6, 5131, 5438);
    			attr_dev(div57, "class", "row nowrap");
    			add_location(div57, file$5, 6, 5083, 5390);
    			attr_dev(div58, "class", "year");
    			attr_dev(div58, "id", "2016");
    			add_location(div58, file$5, 6, 4604, 4911);
    			attr_dev(div59, "class", "main mt5");
    			add_location(div59, file$5, 6, 4582, 4889);
    			add_location(h25, file$5, 6, 5325, 5632);
    			attr_dev(div60, "class", "right mt2");
    			add_location(div60, file$5, 6, 5487, 5794);
    			attr_dev(a5, "href", "https://govinvest.com/");
    			add_location(a5, file$5, 6, 5729, 6036);
    			attr_dev(div61, "class", "tab f09");
    			add_location(div61, file$5, 6, 5704, 6011);
    			attr_dev(div62, "class", "tab");
    			add_location(div62, file$5, 6, 5615, 5922);
    			attr_dev(div63, "class", "mt3");
    			add_location(div63, file$5, 6, 5787, 6094);
    			attr_dev(div64, "class", "year");
    			attr_dev(div64, "id", "2015");
    			add_location(div64, file$5, 6, 5297, 5604);
    			attr_dev(div65, "class", "main mt5");
    			add_location(div65, file$5, 6, 5274, 5581);
    			add_location(h26, file$5, 6, 5990, 6297);
    			add_location(div66, file$5, 6, 6003, 6310);
    			attr_dev(div67, "class", "half");
    			add_location(div67, file$5, 6, 6068, 6375);
    			attr_dev(div68, "class", "mt2");
    			add_location(div68, file$5, 6, 6181, 6488);
    			attr_dev(div69, "class", "half");
    			add_location(div69, file$5, 6, 6163, 6470);
    			attr_dev(div70, "class", "row");
    			add_location(div70, file$5, 6, 6051, 6358);
    			attr_dev(a6, "href", "https://patents.google.com/patent/US20150089409A1/en");
    			add_location(a6, file$5, 6, 6346, 6653);
    			attr_dev(ul2, "class", "mt4 i");
    			add_location(ul2, file$5, 6, 6294, 6601);
    			attr_dev(div71, "class", "half");
    			add_location(div71, file$5, 6, 6512, 6819);
    			attr_dev(div72, "class", "f09 i grey");
    			add_location(div72, file$5, 6, 6700, 7007);
    			attr_dev(div73, "class", "half");
    			add_location(div73, file$5, 6, 6609, 6916);
    			attr_dev(div74, "class", "row mt3");
    			add_location(div74, file$5, 6, 6491, 6798);
    			attr_dev(div75, "class", "year");
    			attr_dev(div75, "id", "2014");
    			add_location(div75, file$5, 6, 5962, 6269);
    			attr_dev(div76, "class", "main mt5");
    			add_location(div76, file$5, 6, 5939, 6246);
    			add_location(h27, file$5, 6, 6830, 7137);
    			attr_dev(div77, "class", "half");
    			add_location(div77, file$5, 6, 6860, 7167);
    			attr_dev(div78, "class", "half");
    			add_location(div78, file$5, 6, 6951, 7258);
    			attr_dev(div79, "class", "row");
    			add_location(div79, file$5, 6, 6843, 7150);
    			attr_dev(div80, "class", "i f09 tab");
    			add_location(div80, file$5, 6, 7157, 7464);
    			attr_dev(div81, "class", "tab mt5");
    			add_location(div81, file$5, 6, 7111, 7418);
    			add_location(i1, file$5, 6, 7349, 7656);
    			attr_dev(div82, "class", "hangright mt5");
    			add_location(div82, file$5, 6, 7303, 7610);
    			attr_dev(div83, "class", "m3");
    			add_location(div83, file$5, 6, 7382, 7689);
    			add_location(div84, file$5, 6, 7578, 7885);
    			add_location(div85, file$5, 6, 7609, 7916);
    			attr_dev(div86, "class", "tab i f09 ml4 mt3");
    			add_location(div86, file$5, 6, 7547, 7854);
    			attr_dev(div87, "class", "year");
    			attr_dev(div87, "id", "2013");
    			add_location(div87, file$5, 6, 6802, 7109);
    			attr_dev(div88, "class", "main mt5");
    			add_location(div88, file$5, 6, 6780, 7087);
    			add_location(h28, file$5, 6, 7719, 8026);
    			attr_dev(div89, "class", "half");
    			add_location(div89, file$5, 6, 7749, 8056);
    			add_location(div90, file$5, 6, 7858, 8165);
    			attr_dev(a7, "href", "https://state.com/");
    			add_location(a7, file$5, 6, 7911, 8218);
    			attr_dev(div91, "class", "tab i f09");
    			add_location(div91, file$5, 6, 7884, 8191);
    			attr_dev(div92, "class", "half");
    			add_location(div92, file$5, 6, 7840, 8147);
    			attr_dev(div93, "class", "row");
    			add_location(div93, file$5, 6, 7732, 8039);
    			attr_dev(div94, "class", "mt3");
    			add_location(div94, file$5, 6, 7971, 8278);
    			attr_dev(div95, "class", "mt3");
    			add_location(div95, file$5, 6, 8113, 8420);
    			attr_dev(div96, "class", "year");
    			attr_dev(div96, "id", "2012");
    			add_location(div96, file$5, 6, 7691, 7998);
    			attr_dev(div97, "class", "main mt5");
    			add_location(div97, file$5, 6, 7668, 7975);
    			add_location(h29, file$5, 6, 8302, 8609);
    			attr_dev(div98, "class", "year");
    			attr_dev(div98, "id", "2011");
    			set_style(div98, "width", "100%");
    			set_style(div98, "max-width", "600px");
    			add_location(div98, file$5, 6, 8236, 8543);
    			attr_dev(div99, "class", "main mt5");
    			add_location(div99, file$5, 6, 8213, 8520);
    			add_location(h210, file$5, 6, 8438, 8745);
    			add_location(div100, file$5, 6, 8451, 8758);
    			add_location(i2, file$5, 6, 8575, 8882);
    			attr_dev(div101, "class", "tab");
    			add_location(div101, file$5, 6, 8624, 8931);
    			add_location(ul3, file$5, 6, 8556, 8863);
    			attr_dev(div102, "class", "mt4 ml2 b navy");
    			add_location(div102, file$5, 6, 8676, 8983);
    			attr_dev(div103, "class", "ml4");
    			add_location(div103, file$5, 6, 8723, 9030);
    			attr_dev(div104, "class", "ml4 i");
    			add_location(div104, file$5, 6, 8770, 9077);
    			attr_dev(div105, "class", "year");
    			attr_dev(div105, "id", "2010");
    			add_location(div105, file$5, 6, 8410, 8717);
    			attr_dev(div106, "class", "main mt5");
    			add_location(div106, file$5, 6, 8387, 8694);
    			attr_dev(div107, "class", "f2");
    			add_location(div107, file$5, 6, 8931, 9238);
    			attr_dev(img54, "class", "ml3");
    			if (img54.src !== (img54_src_value = "./assets/2010/piano.gif")) attr_dev(img54, "src", img54_src_value);
    			add_location(img54, file$5, 6, 8963, 9270);
    			attr_dev(div108, "class", "row");
    			set_style(div108, "justify-content", "normal");
    			add_location(div108, file$5, 6, 8881, 9188);
    			attr_dev(a8, "href", "https://arxiv.org/abs/1901.05350");
    			add_location(a8, file$5, 6, 9025, 9332);
    			add_location(ul4, file$5, 6, 9126, 9433);
    			add_location(li0, file$5, 6, 9021, 9328);
    			attr_dev(a9, "href", "https://repository.ihu.edu.gr//xmlui/handle/11544/29186");
    			add_location(a9, file$5, 6, 9157, 9464);
    			add_location(ul5, file$5, 6, 9291, 9598);
    			add_location(li1, file$5, 6, 9153, 9460);
    			attr_dev(a10, "href", "https://www.isca-speech.org/archive/ISAPh_2018/pdfs/18.pdf");
    			add_location(a10, file$5, 6, 9352, 9659);
    			add_location(ul6, file$5, 6, 9470, 9777);
    			add_location(li2, file$5, 6, 9348, 9655);
    			attr_dev(a11, "href", "https://link.springer.com/chapter/10.1007/978-981-10-8797-4_31");
    			add_location(a11, file$5, 6, 9520, 9827);
    			add_location(ul7, file$5, 6, 9645, 9952);
    			add_location(li3, file$5, 6, 9516, 9823);
    			attr_dev(a12, "href", "https://osf.io/w9nhb");
    			add_location(a12, file$5, 6, 9708, 10015);
    			add_location(ul8, file$5, 6, 9807, 10114);
    			add_location(li4, file$5, 6, 9704, 10011);
    			attr_dev(a13, "href", "https://www.cg.tuwien.ac.at/research/publications/2017/mazurek-2017-vows/mazurek-2017-vows-report.pdf");
    			add_location(a13, file$5, 6, 9855, 10162);
    			add_location(ul9, file$5, 6, 10014, 10321);
    			add_location(li5, file$5, 6, 9851, 10158);
    			attr_dev(a14, "href", "https://www.mdpi.com/2227-9709/4/3/28/htm");
    			add_location(a14, file$5, 6, 10070, 10377);
    			add_location(ul10, file$5, 6, 10169, 10476);
    			add_location(li6, file$5, 6, 10066, 10373);
    			attr_dev(a15, "href", "https://core.ac.uk/download/pdf/132597718.pdf");
    			add_location(a15, file$5, 6, 10231, 10538);
    			add_location(ul11, file$5, 6, 10313, 10620);
    			add_location(li7, file$5, 6, 10227, 10534);
    			attr_dev(a16, "href", "https://otik.uk.zcu.cz/handle/11025/23829");
    			add_location(a16, file$5, 6, 10365, 10672);
    			add_location(ul12, file$5, 6, 10451, 10758);
    			add_location(li8, file$5, 6, 10361, 10668);
    			attr_dev(a17, "href", "https://wlv.openrepository.com/bitstream/handle/2436/601113/Stajner_PhD+thesis.pdf?sequence=1");
    			add_location(a17, file$5, 6, 10501, 10808);
    			add_location(ul13, file$5, 6, 10658, 10965);
    			add_location(li9, file$5, 6, 10497, 10804);
    			attr_dev(a18, "href", "http://l3s.de/~gtran/publications/vu_et_al_2014.pdf");
    			add_location(a18, file$5, 6, 10710, 11017);
    			add_location(ul14, file$5, 6, 10831, 11138);
    			add_location(li10, file$5, 6, 10706, 11013);
    			attr_dev(a19, "href", "https://wiki.eecs.yorku.ca/course_archive/2013-14/W/6339/_media/simple_book.pdf");
    			add_location(a19, file$5, 6, 10883, 11190);
    			add_location(ul15, file$5, 6, 11039, 11346);
    			add_location(li11, file$5, 6, 10879, 11186);
    			attr_dev(a20, "href", "https://www.semanticscholar.org/paper/WikiSimple%3A-Automatic-Simplification-of-Wikipedia-Woodsend-Lapata/e4c71fd504fd6657fc444e82e481b22f952bcaab");
    			add_location(a20, file$5, 6, 11088, 11395);
    			add_location(ul16, file$5, 6, 11307, 11614);
    			add_location(li12, file$5, 6, 11084, 11391);
    			attr_dev(a21, "href", "https://dl.acm.org/citation.cfm?id=2145480");
    			add_location(a21, file$5, 6, 11355, 11662);
    			add_location(ul17, file$5, 6, 11497, 11804);
    			add_location(li13, file$5, 6, 11351, 11658);
    			attr_dev(a22, "href", "https://www.slideshare.net/marti_hearst/the-future-of-search-keynote-at-iknow-2010");
    			add_location(a22, file$5, 6, 11544, 11851);
    			add_location(ul18, file$5, 6, 11661, 11968);
    			add_location(li14, file$5, 6, 11540, 11847);
    			attr_dev(a23, "href", "https://dl.acm.org/citation.cfm?id=1858055");
    			add_location(a23, file$5, 6, 11697, 12004);
    			add_location(ul19, file$5, 6, 11814, 12121);
    			add_location(li15, file$5, 6, 11693, 12000);
    			add_location(ul20, file$5, 6, 9017, 9324);
    			attr_dev(div109, "class", "main mt4");
    			add_location(div109, file$5, 6, 8859, 9166);
    			attr_dev(div110, "class", "space");
    			add_location(div110, file$5, 6, 11853, 12160);
    			attr_dev(div111, "class", "space");
    			add_location(div111, file$5, 6, 11878, 12185);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div0, i0);
    			append_dev(div0, t3);
    			insert_dev(target, div16, anchor);
    			append_dev(div16, div15);
    			append_dev(div15, h20);
    			append_dev(div15, div5);
    			append_dev(div5, div3);
    			mount_component(img0, div3, null);
    			append_dev(div3, div2);
    			append_dev(div5, div4);
    			mount_component(mov0, div4, null);
    			mount_component(img1, div4, null);
    			mount_component(img2, div15, null);
    			append_dev(div15, div6);
    			mount_component(img3, div6, null);
    			append_dev(div15, iframe);
    			append_dev(div15, div7);
    			append_dev(div15, div8);
    			mount_component(mov1, div8, null);
    			append_dev(div15, div10);
    			append_dev(div10, div9);
    			append_dev(div15, div13);
    			append_dev(div13, div11);
    			mount_component(img4, div11, null);
    			mount_component(img5, div11, null);
    			append_dev(div13, div12);
    			mount_component(img6, div12, null);
    			mount_component(img7, div12, null);
    			append_dev(div15, div14);
    			mount_component(img8, div14, null);
    			insert_dev(target, div27, anchor);
    			append_dev(div27, div26);
    			append_dev(div26, h21);
    			append_dev(div26, div19);
    			append_dev(div19, div17);
    			mount_component(img9, div17, null);
    			append_dev(div19, div18);
    			mount_component(img10, div18, null);
    			mount_component(img11, div18, null);
    			mount_component(img12, div18, null);
    			append_dev(div26, ul0);
    			append_dev(ul0, t9);
    			append_dev(ul0, div20);
    			append_dev(div20, t10);
    			append_dev(div20, a1);
    			append_dev(div20, t12);
    			append_dev(div26, div21);
    			mount_component(img13, div21, null);
    			mount_component(img14, div21, null);
    			append_dev(div26, div25);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, t13);
    			append_dev(div23, div22);
    			append_dev(div22, t14);
    			append_dev(div22, a2);
    			mount_component(img15, div25, null);
    			insert_dev(target, div39, anchor);
    			append_dev(div39, div38);
    			append_dev(div38, h22);
    			append_dev(div38, div31);
    			append_dev(div31, div28);
    			mount_component(img16, div28, null);
    			mount_component(img17, div28, null);
    			append_dev(div31, div30);
    			mount_component(img18, div30, null);
    			mount_component(img19, div30, null);
    			append_dev(div30, ul1);
    			append_dev(ul1, t17);
    			append_dev(ul1, div29);
    			append_dev(div29, t18);
    			append_dev(div29, a3);
    			append_dev(div38, div36);
    			append_dev(div36, div32);
    			mount_component(img20, div32, null);
    			mount_component(img21, div32, null);
    			append_dev(div36, div35);
    			append_dev(div35, div33);
    			append_dev(div35, div34);
    			append_dev(div38, div37);
    			mount_component(img22, div37, null);
    			mount_component(hr0, div38, null);
    			insert_dev(target, div47, anchor);
    			append_dev(div47, div46);
    			append_dev(div46, h23);
    			mount_component(img23, div46, null);
    			append_dev(div46, div44);
    			append_dev(div44, div42);
    			mount_component(img24, div42, null);
    			append_dev(div42, div40);
    			mount_component(img25, div40, null);
    			append_dev(div42, div41);
    			mount_component(img26, div41, null);
    			append_dev(div44, div43);
    			mount_component(img27, div43, null);
    			mount_component(img28, div43, null);
    			append_dev(div46, div45);
    			append_dev(div45, t23);
    			append_dev(div45, a4);
    			mount_component(hr1, div46, null);
    			insert_dev(target, div59, anchor);
    			append_dev(div59, div58);
    			append_dev(div58, h24);
    			append_dev(div58, div51);
    			append_dev(div51, div49);
    			mount_component(img29, div49, null);
    			append_dev(div49, div48);
    			mount_component(img30, div48, null);
    			append_dev(div51, div50);
    			mount_component(img31, div50, null);
    			append_dev(div58, div52);
    			mount_component(img32, div52, null);
    			append_dev(div58, div53);
    			mount_component(youtube, div53, null);
    			append_dev(div58, div57);
    			append_dev(div57, div54);
    			append_dev(div57, div56);
    			append_dev(div56, div55);
    			mount_component(img33, div55, null);
    			mount_component(hr2, div58, null);
    			insert_dev(target, div65, anchor);
    			append_dev(div65, div64);
    			append_dev(div64, h25);
    			mount_component(img34, div64, null);
    			mount_component(img35, div64, null);
    			append_dev(div64, div60);
    			mount_component(img36, div64, null);
    			append_dev(div64, div62);
    			mount_component(img37, div62, null);
    			append_dev(div62, div61);
    			append_dev(div61, t28);
    			append_dev(div61, a5);
    			append_dev(div64, div63);
    			mount_component(img38, div63, null);
    			insert_dev(target, div76, anchor);
    			append_dev(div76, div75);
    			append_dev(div75, h26);
    			append_dev(div75, div66);
    			append_dev(div75, div70);
    			append_dev(div70, div67);
    			mount_component(img39, div67, null);
    			append_dev(div70, div69);
    			append_dev(div69, div68);
    			mount_component(img40, div68, null);
    			append_dev(div75, ul2);
    			append_dev(ul2, t32);
    			append_dev(ul2, a6);
    			mount_component(img41, a6, null);
    			append_dev(div75, div74);
    			append_dev(div74, div71);
    			mount_component(img42, div71, null);
    			append_dev(div74, div73);
    			mount_component(img43, div73, null);
    			append_dev(div73, div72);
    			insert_dev(target, div88, anchor);
    			append_dev(div88, div87);
    			append_dev(div87, h27);
    			append_dev(div87, div79);
    			append_dev(div79, div77);
    			mount_component(img44, div77, null);
    			append_dev(div79, div78);
    			mount_component(img45, div78, null);
    			mount_component(img46, div78, null);
    			append_dev(div87, div81);
    			append_dev(div81, t35);
    			append_dev(div81, div80);
    			mount_component(img47, div81, null);
    			append_dev(div87, div82);
    			append_dev(div82, t37);
    			append_dev(div82, i1);
    			append_dev(div87, div83);
    			mount_component(img48, div83, null);
    			mount_component(img49, div87, null);
    			append_dev(div87, div86);
    			append_dev(div86, div84);
    			append_dev(div86, div85);
    			insert_dev(target, div97, anchor);
    			append_dev(div97, div96);
    			append_dev(div96, h28);
    			append_dev(div96, div93);
    			append_dev(div93, div89);
    			mount_component(img50, div89, null);
    			append_dev(div93, div92);
    			append_dev(div92, div90);
    			append_dev(div92, div91);
    			append_dev(div91, t43);
    			append_dev(div91, a7);
    			append_dev(div96, div94);
    			mount_component(img51, div94, null);
    			append_dev(div96, div95);
    			mount_component(img52, div95, null);
    			insert_dev(target, div99, anchor);
    			append_dev(div99, div98);
    			append_dev(div98, h29);
    			mount_component(vimeo, div98, null);
    			insert_dev(target, div106, anchor);
    			append_dev(div106, div105);
    			append_dev(div105, h210);
    			append_dev(div105, div100);
    			mount_component(img53, div105, null);
    			append_dev(div105, ul3);
    			append_dev(ul3, t48);
    			append_dev(ul3, i2);
    			append_dev(ul3, div101);
    			append_dev(div105, div102);
    			append_dev(div105, div103);
    			append_dev(div105, div104);
    			mount_component(hr3, div106, null);
    			insert_dev(target, div109, anchor);
    			append_dev(div109, div108);
    			append_dev(div108, div107);
    			append_dev(div108, img54);
    			append_dev(div109, ul20);
    			append_dev(ul20, li0);
    			append_dev(li0, a8);
    			append_dev(li0, ul4);
    			append_dev(ul20, li1);
    			append_dev(li1, a9);
    			append_dev(li1, ul5);
    			append_dev(ul20, li2);
    			append_dev(li2, a10);
    			append_dev(li2, ul6);
    			append_dev(ul20, li3);
    			append_dev(li3, a11);
    			append_dev(li3, ul7);
    			append_dev(ul20, li4);
    			append_dev(li4, a12);
    			append_dev(li4, ul8);
    			append_dev(ul20, li5);
    			append_dev(li5, a13);
    			append_dev(li5, ul9);
    			append_dev(ul20, li6);
    			append_dev(li6, a14);
    			append_dev(li6, ul10);
    			append_dev(ul20, li7);
    			append_dev(li7, a15);
    			append_dev(li7, ul11);
    			append_dev(ul20, li8);
    			append_dev(li8, a16);
    			append_dev(li8, ul12);
    			append_dev(ul20, li9);
    			append_dev(li9, a17);
    			append_dev(li9, ul13);
    			append_dev(ul20, li10);
    			append_dev(li10, a18);
    			append_dev(li10, ul14);
    			append_dev(ul20, li11);
    			append_dev(li11, a19);
    			append_dev(li11, ul15);
    			append_dev(ul20, li12);
    			append_dev(li12, a20);
    			append_dev(li12, ul16);
    			append_dev(ul20, li13);
    			append_dev(li13, a21);
    			append_dev(li13, ul17);
    			append_dev(ul20, li14);
    			append_dev(li14, a22);
    			append_dev(li14, ul18);
    			append_dev(ul20, li15);
    			append_dev(li15, a23);
    			append_dev(li15, ul19);
    			insert_dev(target, div110, anchor);
    			insert_dev(target, div111, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const img36_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				img36_changes.$$scope = { dirty, ctx };
    			}

    			img36.$set(img36_changes);
    			const img37_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				img37_changes.$$scope = { dirty, ctx };
    			}

    			img37.$set(img37_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(img0.$$.fragment, local);
    			transition_in(mov0.$$.fragment, local);
    			transition_in(img1.$$.fragment, local);
    			transition_in(img2.$$.fragment, local);
    			transition_in(img3.$$.fragment, local);
    			transition_in(mov1.$$.fragment, local);
    			transition_in(img4.$$.fragment, local);
    			transition_in(img5.$$.fragment, local);
    			transition_in(img6.$$.fragment, local);
    			transition_in(img7.$$.fragment, local);
    			transition_in(img8.$$.fragment, local);
    			transition_in(img9.$$.fragment, local);
    			transition_in(img10.$$.fragment, local);
    			transition_in(img11.$$.fragment, local);
    			transition_in(img12.$$.fragment, local);
    			transition_in(img13.$$.fragment, local);
    			transition_in(img14.$$.fragment, local);
    			transition_in(img15.$$.fragment, local);
    			transition_in(img16.$$.fragment, local);
    			transition_in(img17.$$.fragment, local);
    			transition_in(img18.$$.fragment, local);
    			transition_in(img19.$$.fragment, local);
    			transition_in(img20.$$.fragment, local);
    			transition_in(img21.$$.fragment, local);
    			transition_in(img22.$$.fragment, local);
    			transition_in(hr0.$$.fragment, local);
    			transition_in(img23.$$.fragment, local);
    			transition_in(img24.$$.fragment, local);
    			transition_in(img25.$$.fragment, local);
    			transition_in(img26.$$.fragment, local);
    			transition_in(img27.$$.fragment, local);
    			transition_in(img28.$$.fragment, local);
    			transition_in(hr1.$$.fragment, local);
    			transition_in(img29.$$.fragment, local);
    			transition_in(img30.$$.fragment, local);
    			transition_in(img31.$$.fragment, local);
    			transition_in(img32.$$.fragment, local);
    			transition_in(youtube.$$.fragment, local);
    			transition_in(img33.$$.fragment, local);
    			transition_in(hr2.$$.fragment, local);
    			transition_in(img34.$$.fragment, local);
    			transition_in(img35.$$.fragment, local);
    			transition_in(img36.$$.fragment, local);
    			transition_in(img37.$$.fragment, local);
    			transition_in(img38.$$.fragment, local);
    			transition_in(img39.$$.fragment, local);
    			transition_in(img40.$$.fragment, local);
    			transition_in(img41.$$.fragment, local);
    			transition_in(img42.$$.fragment, local);
    			transition_in(img43.$$.fragment, local);
    			transition_in(img44.$$.fragment, local);
    			transition_in(img45.$$.fragment, local);
    			transition_in(img46.$$.fragment, local);
    			transition_in(img47.$$.fragment, local);
    			transition_in(img48.$$.fragment, local);
    			transition_in(img49.$$.fragment, local);
    			transition_in(img50.$$.fragment, local);
    			transition_in(img51.$$.fragment, local);
    			transition_in(img52.$$.fragment, local);
    			transition_in(vimeo.$$.fragment, local);
    			transition_in(img53.$$.fragment, local);
    			transition_in(hr3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(img0.$$.fragment, local);
    			transition_out(mov0.$$.fragment, local);
    			transition_out(img1.$$.fragment, local);
    			transition_out(img2.$$.fragment, local);
    			transition_out(img3.$$.fragment, local);
    			transition_out(mov1.$$.fragment, local);
    			transition_out(img4.$$.fragment, local);
    			transition_out(img5.$$.fragment, local);
    			transition_out(img6.$$.fragment, local);
    			transition_out(img7.$$.fragment, local);
    			transition_out(img8.$$.fragment, local);
    			transition_out(img9.$$.fragment, local);
    			transition_out(img10.$$.fragment, local);
    			transition_out(img11.$$.fragment, local);
    			transition_out(img12.$$.fragment, local);
    			transition_out(img13.$$.fragment, local);
    			transition_out(img14.$$.fragment, local);
    			transition_out(img15.$$.fragment, local);
    			transition_out(img16.$$.fragment, local);
    			transition_out(img17.$$.fragment, local);
    			transition_out(img18.$$.fragment, local);
    			transition_out(img19.$$.fragment, local);
    			transition_out(img20.$$.fragment, local);
    			transition_out(img21.$$.fragment, local);
    			transition_out(img22.$$.fragment, local);
    			transition_out(hr0.$$.fragment, local);
    			transition_out(img23.$$.fragment, local);
    			transition_out(img24.$$.fragment, local);
    			transition_out(img25.$$.fragment, local);
    			transition_out(img26.$$.fragment, local);
    			transition_out(img27.$$.fragment, local);
    			transition_out(img28.$$.fragment, local);
    			transition_out(hr1.$$.fragment, local);
    			transition_out(img29.$$.fragment, local);
    			transition_out(img30.$$.fragment, local);
    			transition_out(img31.$$.fragment, local);
    			transition_out(img32.$$.fragment, local);
    			transition_out(youtube.$$.fragment, local);
    			transition_out(img33.$$.fragment, local);
    			transition_out(hr2.$$.fragment, local);
    			transition_out(img34.$$.fragment, local);
    			transition_out(img35.$$.fragment, local);
    			transition_out(img36.$$.fragment, local);
    			transition_out(img37.$$.fragment, local);
    			transition_out(img38.$$.fragment, local);
    			transition_out(img39.$$.fragment, local);
    			transition_out(img40.$$.fragment, local);
    			transition_out(img41.$$.fragment, local);
    			transition_out(img42.$$.fragment, local);
    			transition_out(img43.$$.fragment, local);
    			transition_out(img44.$$.fragment, local);
    			transition_out(img45.$$.fragment, local);
    			transition_out(img46.$$.fragment, local);
    			transition_out(img47.$$.fragment, local);
    			transition_out(img48.$$.fragment, local);
    			transition_out(img49.$$.fragment, local);
    			transition_out(img50.$$.fragment, local);
    			transition_out(img51.$$.fragment, local);
    			transition_out(img52.$$.fragment, local);
    			transition_out(vimeo.$$.fragment, local);
    			transition_out(img53.$$.fragment, local);
    			transition_out(hr3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(div16);
    			destroy_component(img0);
    			destroy_component(mov0);
    			destroy_component(img1);
    			destroy_component(img2);
    			destroy_component(img3);
    			destroy_component(mov1);
    			destroy_component(img4);
    			destroy_component(img5);
    			destroy_component(img6);
    			destroy_component(img7);
    			destroy_component(img8);
    			if (detaching) detach_dev(div27);
    			destroy_component(img9);
    			destroy_component(img10);
    			destroy_component(img11);
    			destroy_component(img12);
    			destroy_component(img13);
    			destroy_component(img14);
    			destroy_component(img15);
    			if (detaching) detach_dev(div39);
    			destroy_component(img16);
    			destroy_component(img17);
    			destroy_component(img18);
    			destroy_component(img19);
    			destroy_component(img20);
    			destroy_component(img21);
    			destroy_component(img22);
    			destroy_component(hr0);
    			if (detaching) detach_dev(div47);
    			destroy_component(img23);
    			destroy_component(img24);
    			destroy_component(img25);
    			destroy_component(img26);
    			destroy_component(img27);
    			destroy_component(img28);
    			destroy_component(hr1);
    			if (detaching) detach_dev(div59);
    			destroy_component(img29);
    			destroy_component(img30);
    			destroy_component(img31);
    			destroy_component(img32);
    			destroy_component(youtube);
    			destroy_component(img33);
    			destroy_component(hr2);
    			if (detaching) detach_dev(div65);
    			destroy_component(img34);
    			destroy_component(img35);
    			destroy_component(img36);
    			destroy_component(img37);
    			destroy_component(img38);
    			if (detaching) detach_dev(div76);
    			destroy_component(img39);
    			destroy_component(img40);
    			destroy_component(img41);
    			destroy_component(img42);
    			destroy_component(img43);
    			if (detaching) detach_dev(div88);
    			destroy_component(img44);
    			destroy_component(img45);
    			destroy_component(img46);
    			destroy_component(img47);
    			destroy_component(img48);
    			destroy_component(img49);
    			if (detaching) detach_dev(div97);
    			destroy_component(img50);
    			destroy_component(img51);
    			destroy_component(img52);
    			if (detaching) detach_dev(div99);
    			destroy_component(vimeo);
    			if (detaching) detach_dev(div106);
    			destroy_component(img53);
    			destroy_component(hr3);
    			if (detaching) detach_dev(div109);
    			if (detaching) detach_dev(div110);
    			if (detaching) detach_dev(div111);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Part> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Part", $$slots, []);
    	$$self.$capture_state = () => ({ Img, Mov, Youtube, Hr, Vimeo });
    	return [];
    }

    class Part extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Part",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* portfolio/Main.svelte generated by Svelte v3.22.2 */
    const file$6 = "portfolio/Main.svelte";

    function create_fragment$6(ctx) {
    	let stage;
    	let t;
    	let footer;
    	let current;
    	const part = new Part({ $$inline: true });

    	const block = {
    		c: function create() {
    			stage = element("stage");
    			create_component(part.$$.fragment);
    			t = space();
    			footer = element("footer");
    			add_location(stage, file$6, 10, 0, 110);
    			add_location(footer, file$6, 13, 0, 138);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, stage, anchor);
    			mount_component(part, stage, null);
    			insert_dev(target, t, anchor);
    			insert_dev(target, footer, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(part.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(part.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(stage);
    			destroy_component(part);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let title = "";
    	let sub = "";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Main", $$slots, []);
    	$$self.$capture_state = () => ({ Part, title, sub });

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) title = $$props.title;
    		if ("sub" in $$props) sub = $$props.sub;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new Main({
      target: document.body,
      props: {},
    });

    return app;

}());
