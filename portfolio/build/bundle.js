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

    // (27:2) {:else}
    function create_else_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*src*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*caption*/ ctx[2]);
    			set_style(img, "width", /*width*/ ctx[3]);
    			set_style(img, "margin-bottom", "0px");
    			add_location(img, file, 27, 4, 490);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*src*/ 2 && img.src !== (img_src_value = /*src*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*caption*/ 4) {
    				attr_dev(img, "alt", /*caption*/ ctx[2]);
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
    		source: "(27:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (23:2) {#if link}
    function create_if_block(ctx) {
    	let a;
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			img = element("img");
    			if (img.src !== (img_src_value = /*src*/ ctx[1])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", /*caption*/ ctx[2]);
    			set_style(img, "width", /*width*/ ctx[3]);
    			set_style(img, "margin-bottom", "0px");
    			add_location(img, file, 24, 6, 397);
    			attr_dev(a, "href", /*link*/ ctx[0]);
    			attr_dev(a, "class", "link svelte-11my378");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file, 23, 4, 346);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*src*/ 2 && img.src !== (img_src_value = /*src*/ ctx[1])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*caption*/ 4) {
    				attr_dev(img, "alt", /*caption*/ ctx[2]);
    			}

    			if (dirty & /*width*/ 8) {
    				set_style(img, "width", /*width*/ ctx[3]);
    			}

    			if (dirty & /*link*/ 1) {
    				attr_dev(a, "href", /*link*/ ctx[0]);
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
    		source: "(23:2) {#if link}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let t;
    	let div0;

    	function select_block_type(ctx, dirty) {
    		if (/*link*/ ctx[0]) return create_if_block;
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
    			add_location(div0, file, 29, 2, 570);
    			attr_dev(div1, "class", "container svelte-11my378");
    			add_location(div1, file, 21, 0, 305);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			div0.innerHTML = /*caption*/ ctx[2];
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

    			if (dirty & /*caption*/ 4) div0.innerHTML = /*caption*/ ctx[2];		},
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
    	let { href = "" } = $$props;
    	link = link || href;
    	let { width = "100%" } = $$props;
    	const writable_props = ["src", "caption", "link", "href", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Img> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Img", $$slots, []);

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("caption" in $$props) $$invalidate(2, caption = $$props.caption);
    		if ("link" in $$props) $$invalidate(0, link = $$props.link);
    		if ("href" in $$props) $$invalidate(4, href = $$props.href);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    	};

    	$$self.$capture_state = () => ({ src, caption, link, href, width });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("caption" in $$props) $$invalidate(2, caption = $$props.caption);
    		if ("link" in $$props) $$invalidate(0, link = $$props.link);
    		if ("href" in $$props) $$invalidate(4, href = $$props.href);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [link, src, caption, width, href];
    }

    class Img extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			src: 1,
    			caption: 2,
    			link: 0,
    			href: 4,
    			width: 3
    		});

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

    	get href() {
    		throw new Error("<Img>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
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

    // (30:2) {:else}
    function create_else_block$1(ctx) {
    	let video;
    	let video_src_value;

    	const block = {
    		c: function create() {
    			video = element("video");
    			set_style(video, "width", /*width*/ ctx[3]);
    			set_style(video, "margin-bottom", "0px");
    			if (video.src !== (video_src_value = /*src*/ ctx[1])) attr_dev(video, "src", video_src_value);
    			video.autoplay = true;
    			attr_dev(video, "mute", "");
    			video.loop = true;
    			attr_dev(video, "class", "svelte-cyrp5o");
    			add_location(video, file$1, 30, 4, 532);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, video, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*width*/ 8) {
    				set_style(video, "width", /*width*/ ctx[3]);
    			}

    			if (dirty & /*src*/ 2 && video.src !== (video_src_value = /*src*/ ctx[1])) {
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
    		source: "(30:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (26:2) {#if link}
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
    			if (video.src !== (video_src_value = /*src*/ ctx[1])) attr_dev(video, "src", video_src_value);
    			video.autoplay = true;
    			attr_dev(video, "mute", "");
    			video.loop = true;
    			attr_dev(video, "class", "svelte-cyrp5o");
    			add_location(video, file$1, 27, 6, 432);
    			attr_dev(a, "href", /*link*/ ctx[0]);
    			attr_dev(a, "class", "href svelte-cyrp5o");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$1, 26, 4, 381);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, video);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*width*/ 8) {
    				set_style(video, "width", /*width*/ ctx[3]);
    			}

    			if (dirty & /*src*/ 2 && video.src !== (video_src_value = /*src*/ ctx[1])) {
    				attr_dev(video, "src", video_src_value);
    			}

    			if (dirty & /*link*/ 1) {
    				attr_dev(a, "href", /*link*/ ctx[0]);
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
    		source: "(26:2) {#if link}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let t;
    	let div0;

    	function select_block_type(ctx, dirty) {
    		if (/*link*/ ctx[0]) return create_if_block$1;
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
    			attr_dev(div0, "class", "caption svelte-cyrp5o");
    			add_location(div0, file$1, 32, 2, 619);
    			attr_dev(div1, "class", "container svelte-cyrp5o");
    			add_location(div1, file$1, 24, 0, 340);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			if_block.m(div1, null);
    			append_dev(div1, t);
    			append_dev(div1, div0);
    			div0.innerHTML = /*caption*/ ctx[2];
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

    			if (dirty & /*caption*/ 4) div0.innerHTML = /*caption*/ ctx[2];		},
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
    	let { href = "" } = $$props;
    	link = link || href;
    	let { width = "100%" } = $$props;
    	const writable_props = ["src", "caption", "link", "href", "width"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Mov> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Mov", $$slots, []);

    	$$self.$set = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("caption" in $$props) $$invalidate(2, caption = $$props.caption);
    		if ("link" in $$props) $$invalidate(0, link = $$props.link);
    		if ("href" in $$props) $$invalidate(4, href = $$props.href);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    	};

    	$$self.$capture_state = () => ({ src, caption, link, href, width });

    	$$self.$inject_state = $$props => {
    		if ("src" in $$props) $$invalidate(1, src = $$props.src);
    		if ("caption" in $$props) $$invalidate(2, caption = $$props.caption);
    		if ("link" in $$props) $$invalidate(0, link = $$props.link);
    		if ("href" in $$props) $$invalidate(4, href = $$props.href);
    		if ("width" in $$props) $$invalidate(3, width = $$props.width);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [link, src, caption, width, href];
    }

    class Mov extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			src: 1,
    			caption: 2,
    			link: 0,
    			href: 4,
    			width: 3
    		});

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

    	get href() {
    		throw new Error("<Mov>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
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

    /* portfolio/components/Dot.svelte generated by Svelte v3.22.2 */

    const file$5 = "portfolio/components/Dot.svelte";

    function create_fragment$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "dot svelte-inogt3");
    			set_style(div, "background-color", /*color*/ ctx[0]);
    			add_location(div, file$5, 22, 0, 375);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let { project = "" } = $$props;

    	let colors = {
    		compromise: "#6699cc",
    		wikipedia: "#50617A",
    		freebase: "#6accb2",
    		simple: "#e6b3bc"
    	};

    	let color = colors[project] || "steelblue";
    	const writable_props = ["project"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dot> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Dot", $$slots, []);

    	$$self.$set = $$props => {
    		if ("project" in $$props) $$invalidate(1, project = $$props.project);
    	};

    	$$self.$capture_state = () => ({ project, colors, color });

    	$$self.$inject_state = $$props => {
    		if ("project" in $$props) $$invalidate(1, project = $$props.project);
    		if ("colors" in $$props) colors = $$props.colors;
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [color, project];
    }

    class Dot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { project: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dot",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get project() {
    		throw new Error("<Dot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set project(value) {
    		throw new Error("<Dot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* portfolio/build/Part.html generated by Svelte v3.22.2 */
    const file$6 = "portfolio/build/Part.html";

    function create_fragment$6(ctx) {
    	let div1;
    	let a0;
    	let div0;
    	let div31;
    	let div30;
    	let h20;
    	let div7;
    	let div6;
    	let div3;
    	let t3;
    	let div2;
    	let div4;
    	let t5;
    	let a1;
    	let div5;
    	let div8;
    	let div10;
    	let div9;
    	let div13;
    	let div12;
    	let a2;
    	let t8;
    	let div11;
    	let div14;
    	let div16;
    	let t10;
    	let a3;
    	let div15;
    	let div18;
    	let div17;
    	let div25;
    	let div24;
    	let div19;
    	let a4;
    	let div20;
    	let a5;
    	let div21;
    	let a6;
    	let div23;
    	let a7;
    	let div22;
    	let div28;
    	let div27;
    	let div26;
    	let div29;
    	let div42;
    	let div41;
    	let h21;
    	let div34;
    	let div33;
    	let div32;
    	let div36;
    	let iframe;
    	let iframe_src_value;
    	let script;
    	let script_src_value;
    	let div35;
    	let div37;
    	let div39;
    	let div38;
    	let div40;
    	let div62;
    	let div61;
    	let h22;
    	let div50;
    	let div48;
    	let div47;
    	let div46;
    	let div43;
    	let div44;
    	let t23;
    	let a8;
    	let div45;
    	let t25;
    	let a9;
    	let div49;
    	let div51;
    	let div54;
    	let div53;
    	let div52;
    	let t27;
    	let a10;
    	let div55;
    	let div56;
    	let div59;
    	let div57;
    	let div58;
    	let div60;
    	let div73;
    	let div72;
    	let h23;
    	let div65;
    	let div63;
    	let div64;
    	let ul0;
    	let t30;
    	let div66;
    	let t31;
    	let a11;
    	let t33;
    	let div67;
    	let div71;
    	let div70;
    	let div69;
    	let t34;
    	let div68;
    	let t35;
    	let a12;
    	let div85;
    	let div84;
    	let h24;
    	let div77;
    	let div74;
    	let div76;
    	let ul1;
    	let t38;
    	let div75;
    	let t39;
    	let a13;
    	let div82;
    	let div78;
    	let div81;
    	let div79;
    	let div80;
    	let div83;
    	let div93;
    	let div92;
    	let h25;
    	let div90;
    	let div88;
    	let div86;
    	let div87;
    	let div89;
    	let div91;
    	let t44;
    	let a14;
    	let div105;
    	let div104;
    	let h26;
    	let div97;
    	let div95;
    	let div94;
    	let div96;
    	let div98;
    	let div99;
    	let div103;
    	let div100;
    	let div102;
    	let div101;
    	let div110;
    	let div109;
    	let h27;
    	let div106;
    	let t48;
    	let a15;
    	let div107;
    	let div108;
    	let div121;
    	let div120;
    	let h28;
    	let div111;
    	let div115;
    	let div112;
    	let div114;
    	let div113;
    	let ul2;
    	let t52;
    	let a16;
    	let div119;
    	let div116;
    	let div118;
    	let div117;
    	let div133;
    	let div132;
    	let h29;
    	let div124;
    	let div122;
    	let div123;
    	let div126;
    	let t55;
    	let div125;
    	let div127;
    	let t57;
    	let i0;
    	let div128;
    	let div131;
    	let div129;
    	let div130;
    	let div145;
    	let div144;
    	let h210;
    	let div138;
    	let div134;
    	let div137;
    	let div135;
    	let div136;
    	let t63;
    	let a17;
    	let t65;
    	let div140;
    	let div139;
    	let div142;
    	let div141;
    	let div143;
    	let div147;
    	let div146;
    	let h211;
    	let div152;
    	let div151;
    	let h212;
    	let div148;
    	let ul3;
    	let t70;
    	let i1;
    	let div149;
    	let b;
    	let t73;
    	let div150;
    	let div171;
    	let div154;
    	let div153;
    	let img75;
    	let img75_src_value;
    	let ul20;
    	let div155;
    	let a18;
    	let ul4;
    	let div156;
    	let a19;
    	let ul5;
    	let div157;
    	let a20;
    	let ul6;
    	let div158;
    	let a21;
    	let ul7;
    	let div159;
    	let a22;
    	let ul8;
    	let div160;
    	let a23;
    	let ul9;
    	let div161;
    	let a24;
    	let ul10;
    	let div162;
    	let a25;
    	let ul11;
    	let div163;
    	let a26;
    	let ul12;
    	let div164;
    	let a27;
    	let ul13;
    	let div165;
    	let a28;
    	let ul14;
    	let div166;
    	let a29;
    	let ul15;
    	let div167;
    	let a30;
    	let ul16;
    	let div168;
    	let a31;
    	let ul17;
    	let div169;
    	let a32;
    	let ul18;
    	let div170;
    	let a33;
    	let ul19;
    	let div172;
    	let div173;
    	let current;

    	const img0 = new Img({
    			props: {
    				src: "./assets/2022/v14.jpg",
    				width: "350px",
    				href: "https://github.com/spencermountain/compromise/releases/tag/14.0.0"
    			},
    			$$inline: true
    		});

    	const img1 = new Img({
    			props: {
    				src: "./assets/2022/mayor.jpg",
    				width: "150px",
    				href: "https://vimeo.com/29689919"
    			},
    			$$inline: true
    		});

    	const img2 = new Img({
    			props: {
    				src: "./assets/2022/concert.jpg",
    				caption: "first concert back"
    			},
    			$$inline: true
    		});

    	const img3 = new Img({
    			props: {
    				src: "./assets/2022/kaaate.jpg",
    				width: "110px"
    			},
    			$$inline: true
    		});

    	const img4 = new Img({
    			props: {
    				src: "./assets/2022/trie.jpg",
    				width: "200px"
    			},
    			$$inline: true
    		});

    	const img5 = new Img({
    			props: {
    				src: "./assets/2022/hurricane.jpg",
    				width: "200px"
    			},
    			$$inline: true
    		});

    	const img6 = new Img({
    			props: {
    				src: "./assets/2022/transit-lines.jpg",
    				href: "https://toronto.cityhallwatcher.com/p/chw196"
    			},
    			$$inline: true
    		});

    	const img7 = new Img({
    			props: {
    				src: "./assets/2022/sky.jpg",
    				width: "300px"
    			},
    			$$inline: true
    		});

    	const img8 = new Img({
    			props: {
    				src: "./assets/2022/model.jpg",
    				width: "250px"
    			},
    			$$inline: true
    		});

    	const img9 = new Img({
    			props: {
    				src: "./assets/2022/horizon.jpg",
    				width: "300px"
    			},
    			$$inline: true
    		});

    	const img10 = new Img({
    			props: {
    				src: "./assets/2022/italian.jpg",
    				width: "340px"
    			},
    			$$inline: true
    		});

    	const img11 = new Img({
    			props: {
    				src: "./assets/2022/truck.jpg",
    				width: "200px"
    			},
    			$$inline: true
    		});

    	const img12 = new Img({
    			props: {
    				src: "./assets/2022/baby.jpg",
    				width: "100px"
    			},
    			$$inline: true
    		});

    	const img13 = new Img({
    			props: {
    				src: "./assets/2022/swirl.jpg",
    				width: "300px"
    			},
    			$$inline: true
    		});

    	const img14 = new Img({
    			props: { src: "./assets/2021/lockdown.jpg" },
    			$$inline: true
    		});

    	const img15 = new Img({
    			props: {
    				src: "./assets/2021/newton.jpg",
    				width: "400px",
    				href: "https://twitter.com/jmitch/status/1369735601004703746",
    				caption: "date-parser for Newton email client "
    			},
    			$$inline: true
    		});

    	const img16 = new Img({
    			props: {
    				src: "./assets/2021/fluent.jpg",
    				width: "400px",
    				href: "https://www.fluent.co/",
    				caption: "translation forfluent.co"
    			},
    			$$inline: true
    		});

    	const img17 = new Img({
    			props: {
    				src: "./assets/2020/sankey.jpg",
    				width: "150px",
    				href: "https://github.com/spencermountain/somehow-sankey"
    			},
    			$$inline: true
    		});

    	const img18 = new Img({
    			props: {
    				src: "./assets/2020/rockets.png",
    				width: "150px",
    				href: "https://github.com/spencermountain/somehow-timeline"
    			},
    			$$inline: true
    		});

    	const img19 = new Img({
    			props: {
    				src: "./assets/2020/covid.png",
    				width: "150px",
    				href: "https://www.reddit.com/r/dataisbeautiful/comments/fkwova/oc_rna_sequence_of_covid19_this_8kb_of_data_is/"
    			},
    			$$inline: true
    		});

    	const img20 = new Img({
    			props: {
    				src: "./assets/2020/skydome.jpg",
    				width: "200px",
    				href: "http://thensome.how/2020/covid-as-skydome/"
    			},
    			$$inline: true
    		});

    	const img21 = new Img({
    			props: {
    				src: "./assets/2020/2020.jpg",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img22 = new Img({
    			props: {
    				src: "./assets/2020/fr-compromise.png",
    				width: "450px",
    				caption: "compromise-community begins<br/><i>french-language conjugation</i>",
    				link: "https://github.com/nlp-compromise/fr-compromise"
    			},
    			$$inline: true
    		});

    	const mov0 = new Mov({
    			props: {
    				src: "./assets/2020/fast-mode.mp4",
    				width: "450px",
    				href: "https://github.com/spencermountain/compromise/tree/master/plugins/scan",
    				caption: "compromise became fast<br/><i>contract w/ <a href=\"https://moov.co/\">Moov.co</a></i>"
    			},
    			$$inline: true
    		});

    	const mov1 = new Mov({
    			props: {
    				src: "./assets/2020/hand-computer.mp4",
    				width: "250px",
    				href: "http://blog.spencermounta.in/2020/computer-is-furniture/index.html"
    			},
    			$$inline: true
    		});

    	const img23 = new Img({
    			props: {
    				src: "./assets/2020/wayne.jpg",
    				width: "150px"
    			},
    			$$inline: true
    		});

    	const img24 = new Img({
    			props: {
    				src: "./assets/2019/blender.jpg",
    				width: "175px"
    			},
    			$$inline: true
    		});

    	const img25 = new Img({
    			props: {
    				src: "./assets/2020/sport-season.png",
    				width: "250px",
    				href: "http://thensome.how/2018/sports-by-city/"
    			},
    			$$inline: true
    		});

    	const img26 = new Img({
    			props: {
    				src: "./assets/2020/calendar.png",
    				width: "200px",
    				href: "http://blog.spencermounta.in/2019/millenial-calendar/index.html"
    			},
    			$$inline: true
    		});

    	const img27 = new Img({
    			props: {
    				src: "./assets/2020/gun-and-rose.png",
    				width: "350px",
    				href: "https://observablehq.com/@spencermountain/nouns"
    			},
    			$$inline: true
    		});

    	const img28 = new Img({
    			props: {
    				src: "./assets/2019/v12.png",
    				width: "380px",
    				href: "https://observablehq.com/@spencermountain/compromise-values"
    			},
    			$$inline: true
    		});

    	const img29 = new Img({
    			props: {
    				src: "./assets/2019/2019.jpg",
    				width: "150px"
    			},
    			$$inline: true
    		});

    	const img30 = new Img({
    			props: {
    				src: "./assets/2019/dumps.png",
    				width: "150px",
    				href: "http://thensome.how/2019/ontario-landfills/"
    			},
    			$$inline: true
    		});

    	const img31 = new Img({
    			props: {
    				src: "./assets/2019/globe.jpg",
    				width: "150px",
    				href: "http://blog.spencermounta.in/2019/understanding-the-planet/index.html"
    			},
    			$$inline: true
    		});

    	const img32 = new Img({
    			props: {
    				src: "./assets/2019/twitter.png",
    				width: "380px"
    			},
    			$$inline: true
    		});

    	const img33 = new Img({
    			props: {
    				src: "./assets/2019/2019-2.jpg",
    				width: "120px"
    			},
    			$$inline: true
    		});

    	const img34 = new Img({
    			props: {
    				src: "./assets/2019/venngage.jpg",
    				width: "60px"
    			},
    			$$inline: true
    		});

    	const img35 = new Img({
    			props: {
    				src: "./assets/2018/geneology.png",
    				width: "450px",
    				caption: "did my genealogy. it was hard.",
    				href: "http://blog.spencermounta.in/2019/my-family-tree/index.html"
    			},
    			$$inline: true
    		});

    	const img36 = new Img({
    			props: {
    				src: "./assets/2018/cheese-maker.png",
    				width: "250px"
    			},
    			$$inline: true
    		});

    	const img37 = new Img({
    			props: {
    				src: "./assets/2018/mars.jpg",
    				width: "350px"
    			},
    			$$inline: true
    		});

    	const img38 = new Img({
    			props: {
    				src: "./assets/2018/begin-cli.gif",
    				width: "350px",
    				href: "https://observablehq.com/@spencermountain/compromise-dates"
    			},
    			$$inline: true
    		});

    	const img39 = new Img({
    			props: {
    				src: "./assets/2018/spacetime.jpg",
    				width: "250px",
    				href: "https://github.com/spencermountain/spacetime"
    			},
    			$$inline: true
    		});

    	const img40 = new Img({
    			props: {
    				src: "./assets/2018/spacetime.gif",
    				width: "250px",
    				href: "https://github.com/spencermountain/spacetime"
    			},
    			$$inline: true
    		});

    	const img41 = new Img({
    			props: {
    				src: "./assets/2019/colors.png",
    				width: "280px"
    			},
    			$$inline: true
    		});

    	const hr0 = new Hr({ $$inline: true });

    	const img42 = new Img({
    			props: {
    				src: "./assets/2017/tests-failing.png",
    				width: "500px",
    				caption: "compromise v12",
    				href: "https://github.com/spencermountain/compromise/wiki/v12-Release-Notes"
    			},
    			$$inline: true
    		});

    	const img43 = new Img({
    			props: {
    				src: "./assets/2017/who-ordinal.png",
    				width: "350px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img44 = new Img({
    			props: {
    				src: "./assets/2017/2017.jpg",
    				width: "175px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img45 = new Img({
    			props: {
    				src: "./assets/2017/dumpster.gif",
    				width: "400px",
    				href: "https://github.com/spencermountain/dumpster-dive/",
    				caption: "system for parsing wikipedia<br/>in-use at Wolfram Alpha"
    			},
    			$$inline: true
    		});

    	const img46 = new Img({
    			props: {
    				src: "./assets/2017/wtf-wikipedia.png",
    				width: "225px",
    				caption: "some of wikipedia's 600-thousand templates",
    				href: "https://github.com/spencermountain/wtf_wikipedia/"
    			},
    			$$inline: true
    		});

    	const img47 = new Img({
    			props: {
    				src: "./assets/2017/japan.jpg",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const hr1 = new Hr({ $$inline: true });

    	const img48 = new Img({
    			props: {
    				src: "./assets/2016/map.jpg",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img49 = new Img({
    			props: {
    				src: "./assets/2016/yonge-street.jpg",
    				width: "200px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img50 = new Img({
    			props: {
    				src: "./assets/2016/old.jpg",
    				width: "200px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img51 = new Img({
    			props: {
    				src: "./assets/2016/trending.jpg",
    				width: "450px"
    			},
    			$$inline: true
    		});

    	const youtube = new Youtube({
    			props: { video: "WuPVS2tCg8s" },
    			$$inline: true
    		});

    	const img52 = new Img({
    			props: {
    				src: "./assets/2016/montreal.jpg",
    				width: "200px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const hr2 = new Hr({ $$inline: true });

    	const img53 = new Img({
    			props: {
    				src: "./assets/2015/2015.jpg",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img54 = new Img({
    			props: {
    				src: "./assets/2015/toronto.jpg",
    				width: "250px",
    				caption: "moved to Toronto"
    			},
    			$$inline: true
    		});

    	const img55 = new Img({
    			props: {
    				src: "./assets/2017/govdna.png",
    				width: "450px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img56 = new Img({
    			props: {
    				src: "./assets/2015/govinvest2.jpg",
    				width: "300px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img57 = new Img({
    			props: {
    				src: "./assets/2015/playoffs.jpg",
    				width: "400px",
    				caption: "blue jays win ALDS<br/>but lose semi-final"
    			},
    			$$inline: true
    		});

    	const img58 = new Img({
    			props: {
    				src: "./assets/2014/gradschool.jpg",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img59 = new Img({
    			props: {
    				src: "./assets/2014/digraph-genealogy.jpg",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img60 = new Img({
    			props: {
    				src: "./assets/2014/state-patent.jpg",
    				width: "450px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img61 = new Img({
    			props: {
    				src: "./assets/2014/earthbarely1.jpg",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img62 = new Img({
    			props: {
    				src: "./assets/2014/earthbarely2.jpg",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img63 = new Img({
    			props: {
    				src: "./assets/2014/floor-walk.jpg",
    				width: "250px",
    				href: "https://vimeo.com/103858377"
    			},
    			$$inline: true
    		});

    	const img64 = new Img({
    			props: {
    				src: "./assets/2013/london.jpg",
    				width: "350px",
    				href: "https://state.com/"
    			},
    			$$inline: true
    		});

    	const img65 = new Img({
    			props: {
    				src: "./assets/2013/2013.jpg",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img66 = new Img({
    			props: {
    				src: "./assets/2013/Tree.png",
    				width: "150px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img67 = new Img({
    			props: {
    				src: "./assets/2013/alex-techcrunch.jpg",
    				width: "350px",
    				href: "https://www.youtube.com/watch?v=PAymdN2T5oI"
    			},
    			$$inline: true
    		});

    	const img68 = new Img({
    			props: {
    				src: "./assets/2013/deceased-persons.png",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img69 = new Img({
    			props: {
    				src: "./assets/2013/mturk.jpg",
    				width: "320px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img70 = new Img({
    			props: {
    				src: "./assets/2012/london.jpg",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img71 = new Img({
    			props: {
    				src: "./assets/2012/sky.jpg",
    				width: "200px"
    			},
    			$$inline: true
    		});

    	const img72 = new Img({
    			props: {
    				src: "./assets/2012/opinion.png",
    				width: "300px"
    			},
    			$$inline: true
    		});

    	const img73 = new Img({
    			props: {
    				src: "./assets/2012/mars.jpg",
    				width: "550px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const vimeo = new Vimeo({
    			props: { video: "13992710" },
    			$$inline: true
    		});

    	const img74 = new Img({
    			props: {
    				src: "./assets/2010/simple.jpg",
    				width: "450px",
    				href: "https://docs.google.com/spreadsheets/d/1clPt1ivBcf5Kdi02NzoE_KqEMXNylj6q-88qXuvw1lY/edit?usp=sharing"
    			},
    			$$inline: true
    		});

    	const hr3 = new Hr({ $$inline: true });

    	const dot0 = new Dot({
    			props: { project: "compromise" },
    			$$inline: true
    		});

    	const dot1 = new Dot({
    			props: { project: "compromise" },
    			$$inline: true
    		});

    	const dot2 = new Dot({
    			props: { project: "compromise" },
    			$$inline: true
    		});

    	const dot3 = new Dot({
    			props: { project: "compromise" },
    			$$inline: true
    		});

    	const dot4 = new Dot({
    			props: { project: "compromise" },
    			$$inline: true
    		});

    	const dot5 = new Dot({
    			props: { project: "compromise" },
    			$$inline: true
    		});

    	const dot6 = new Dot({
    			props: { project: "compromise" },
    			$$inline: true
    		});

    	const dot7 = new Dot({
    			props: { project: "compromise" },
    			$$inline: true
    		});

    	const dot8 = new Dot({
    			props: { project: "wikipedia" },
    			$$inline: true
    		});

    	const dot9 = new Dot({
    			props: { project: "simple" },
    			$$inline: true
    		});

    	const dot10 = new Dot({
    			props: { project: "simple" },
    			$$inline: true
    		});

    	const dot11 = new Dot({
    			props: { project: "simple" },
    			$$inline: true
    		});

    	const dot12 = new Dot({
    			props: { project: "simple" },
    			$$inline: true
    		});

    	const dot13 = new Dot({
    			props: { project: "simple" },
    			$$inline: true
    		});

    	const dot14 = new Dot({
    			props: { project: "freebase" },
    			$$inline: true
    		});

    	const dot15 = new Dot({
    			props: { project: "simple" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			a0 = element("a");
    			a0.textContent = "〱 ";
    			div0 = element("div");
    			div0.textContent = "spencer kelly";
    			div31 = element("div");
    			div30 = element("div");
    			h20 = element("h2");
    			h20.textContent = "2022";
    			div7 = element("div");
    			div6 = element("div");
    			create_component(img0.$$.fragment);
    			div3 = element("div");
    			t3 = text("released v14 ");
    			div2 = element("div");
    			div2.textContent = "of compromise ";
    			div4 = element("div");
    			t5 = text("it was ");
    			a1 = element("a");
    			a1.textContent = "hard";
    			div5 = element("div");
    			div8 = element("div");
    			create_component(img1.$$.fragment);
    			div10 = element("div");
    			div9 = element("div");
    			create_component(img2.$$.fragment);
    			create_component(img3.$$.fragment);
    			div13 = element("div");
    			create_component(img4.$$.fragment);
    			div12 = element("div");
    			a2 = element("a");
    			a2.textContent = "future of text";
    			t8 = text(" presentation");
    			div11 = element("div");
    			div11.textContent = "on suffix compression";
    			div14 = element("div");
    			create_component(img5.$$.fragment);
    			create_component(img6.$$.fragment);
    			div16 = element("div");
    			t10 = text("guest post on ");
    			a3 = element("a");
    			a3.textContent = "Graphic Matt's newsletter";
    			div15 = element("div");
    			div15.textContent = "about the housing crisis in Toronto";
    			div18 = element("div");
    			create_component(img7.$$.fragment);
    			div17 = element("div");
    			create_component(img8.$$.fragment);
    			create_component(img9.$$.fragment);
    			div25 = element("div");
    			div24 = element("div");
    			div19 = element("div");
    			a4 = element("a");
    			a4.textContent = "french";
    			div20 = element("div");
    			a5 = element("a");
    			a5.textContent = "spanish";
    			div21 = element("div");
    			a6 = element("a");
    			a6.textContent = "german";
    			div23 = element("div");
    			a7 = element("a");
    			a7.textContent = "italian";
    			div22 = element("div");
    			div22.textContent = "in production  →";
    			create_component(img10.$$.fragment);
    			div28 = element("div");
    			div27 = element("div");
    			div26 = element("div");
    			create_component(img11.$$.fragment);
    			div29 = element("div");
    			create_component(img12.$$.fragment);
    			create_component(img13.$$.fragment);
    			div42 = element("div");
    			div41 = element("div");
    			h21 = element("h2");
    			h21.textContent = "2021";
    			div34 = element("div");
    			div33 = element("div");
    			create_component(img14.$$.fragment);
    			div32 = element("div");
    			div32.textContent = "months of lockdown";
    			div36 = element("div");
    			iframe = element("iframe");
    			script = element("script");
    			div35 = element("div");
    			div35.textContent = "NLP-OSS presentation";
    			div37 = element("div");
    			div39 = element("div");
    			create_component(img15.$$.fragment);
    			div38 = element("div");
    			div40 = element("div");
    			create_component(img16.$$.fragment);
    			div62 = element("div");
    			div61 = element("div");
    			h22 = element("h2");
    			h22.textContent = "2020";
    			div50 = element("div");
    			div48 = element("div");
    			create_component(img17.$$.fragment);
    			create_component(img18.$$.fragment);
    			div47 = element("div");
    			create_component(img19.$$.fragment);
    			div46 = element("div");
    			div43 = element("div");
    			div43.textContent = "nhs-covid using compromise      ";
    			div44 = element("div");
    			t23 = text("covid-atlas using spacetime ");
    			a8 = element("a");
    			a8.textContent = "[1]";
    			div45 = element("div");
    			t25 = text("trackers parsing wikipedia ");
    			a9 = element("a");
    			a9.textContent = "[2]";
    			div49 = element("div");
    			create_component(img20.$$.fragment);
    			create_component(img21.$$.fragment);
    			div51 = element("div");
    			create_component(img22.$$.fragment);
    			div54 = element("div");
    			div53 = element("div");
    			div52 = element("div");
    			t27 = text("Guest interview on podcast - ");
    			a10 = element("a");
    			a10.textContent = "How to learn programming";
    			div55 = element("div");
    			create_component(mov0.$$.fragment);
    			div56 = element("div");
    			create_component(mov1.$$.fragment);
    			div59 = element("div");
    			div57 = element("div");
    			create_component(img23.$$.fragment);
    			create_component(img24.$$.fragment);
    			div58 = element("div");
    			create_component(img25.$$.fragment);
    			create_component(img26.$$.fragment);
    			div60 = element("div");
    			create_component(img27.$$.fragment);
    			div73 = element("div");
    			div72 = element("div");
    			h23 = element("h2");
    			h23.textContent = "2019";
    			div65 = element("div");
    			div63 = element("div");
    			create_component(img28.$$.fragment);
    			div64 = element("div");
    			create_component(img29.$$.fragment);
    			create_component(img30.$$.fragment);
    			create_component(img31.$$.fragment);
    			ul0 = element("ul");
    			t30 = text("compromise running in the NHS");
    			div66 = element("div");
    			t31 = text("for ");
    			a11 = element("a");
    			a11.textContent = "MBI health";
    			t33 = text(".");
    			div67 = element("div");
    			create_component(img32.$$.fragment);
    			create_component(img33.$$.fragment);
    			div71 = element("div");
    			div70 = element("div");
    			div69 = element("div");
    			t34 = text("a realtime layout solver");
    			div68 = element("div");
    			t35 = text("for ");
    			a12 = element("a");
    			a12.textContent = "venngage.com";
    			create_component(img34.$$.fragment);
    			div85 = element("div");
    			div84 = element("div");
    			h24 = element("h2");
    			h24.textContent = "2018";
    			div77 = element("div");
    			div74 = element("div");
    			create_component(img35.$$.fragment);
    			create_component(img36.$$.fragment);
    			div76 = element("div");
    			create_component(img37.$$.fragment);
    			create_component(img38.$$.fragment);
    			ul1 = element("ul");
    			t38 = text("a date-parser for natural language");
    			div75 = element("div");
    			t39 = text("for ");
    			a13 = element("a");
    			a13.textContent = "begin.com";
    			div82 = element("div");
    			div78 = element("div");
    			create_component(img39.$$.fragment);
    			create_component(img40.$$.fragment);
    			div81 = element("div");
    			div79 = element("div");
    			div79.textContent = "a timezone library";
    			div80 = element("div");
    			div80.textContent = "also hard.";
    			div83 = element("div");
    			create_component(img41.$$.fragment);
    			create_component(hr0.$$.fragment);
    			div93 = element("div");
    			div92 = element("div");
    			h25 = element("h2");
    			h25.textContent = "2017";
    			create_component(img42.$$.fragment);
    			div90 = element("div");
    			div88 = element("div");
    			create_component(img43.$$.fragment);
    			div86 = element("div");
    			create_component(img44.$$.fragment);
    			div87 = element("div");
    			create_component(img45.$$.fragment);
    			div89 = element("div");
    			create_component(img46.$$.fragment);
    			create_component(img47.$$.fragment);
    			div91 = element("div");
    			t44 = text("compromise in use ");
    			a14 = element("a");
    			a14.textContent = "at the United Nations";
    			create_component(hr1.$$.fragment);
    			div105 = element("div");
    			div104 = element("div");
    			h26 = element("h2");
    			h26.textContent = "2016";
    			div97 = element("div");
    			div95 = element("div");
    			create_component(img48.$$.fragment);
    			div94 = element("div");
    			create_component(img49.$$.fragment);
    			div96 = element("div");
    			create_component(img50.$$.fragment);
    			div98 = element("div");
    			create_component(img51.$$.fragment);
    			div99 = element("div");
    			create_component(youtube.$$.fragment);
    			div103 = element("div");
    			div100 = element("div");
    			div102 = element("div");
    			div101 = element("div");
    			create_component(img52.$$.fragment);
    			create_component(hr2.$$.fragment);
    			div110 = element("div");
    			div109 = element("div");
    			h27 = element("h2");
    			h27.textContent = "2015";
    			create_component(img53.$$.fragment);
    			create_component(img54.$$.fragment);
    			div106 = element("div");
    			t48 = text("pension vizualizations for ");
    			a15 = element("a");
    			a15.textContent = "govInvest";
    			create_component(img55.$$.fragment);
    			div107 = element("div");
    			create_component(img56.$$.fragment);
    			div108 = element("div");
    			create_component(img57.$$.fragment);
    			div121 = element("div");
    			div120 = element("div");
    			h28 = element("h2");
    			h28.textContent = "2014";
    			div111 = element("div");
    			div111.textContent = "went to grad school for a short time.";
    			div115 = element("div");
    			div112 = element("div");
    			create_component(img58.$$.fragment);
    			div114 = element("div");
    			div113 = element("div");
    			create_component(img59.$$.fragment);
    			ul2 = element("ul");
    			t52 = text("granted this weird software patent");
    			a16 = element("a");
    			create_component(img60.$$.fragment);
    			div119 = element("div");
    			div116 = element("div");
    			create_component(img61.$$.fragment);
    			div118 = element("div");
    			create_component(img62.$$.fragment);
    			div117 = element("div");
    			div117.textContent = "CUSEC14 hackathon finalist";
    			create_component(img63.$$.fragment);
    			div133 = element("div");
    			div132 = element("div");
    			h29 = element("h2");
    			h29.textContent = "2013";
    			div124 = element("div");
    			div122 = element("div");
    			create_component(img64.$$.fragment);
    			div123 = element("div");
    			create_component(img65.$$.fragment);
    			create_component(img66.$$.fragment);
    			div126 = element("div");
    			t55 = text("state.com hires 45 people");
    			div125 = element("div");
    			div125.textContent = "all will be laid-off the next year.";
    			create_component(img67.$$.fragment);
    			div127 = element("div");
    			t57 = text("webby nomination - ");
    			i0 = element("i");
    			i0.textContent = "best community, 2013";
    			div128 = element("div");
    			create_component(img68.$$.fragment);
    			create_component(img69.$$.fragment);
    			div131 = element("div");
    			div129 = element("div");
    			div129.textContent = "Freebase shuts-down.";
    			div130 = element("div");
    			div130.textContent = "React and D3 are both created.";
    			div145 = element("div");
    			div144 = element("div");
    			h210 = element("h2");
    			h210.textContent = "2012";
    			div138 = element("div");
    			div134 = element("div");
    			create_component(img70.$$.fragment);
    			div137 = element("div");
    			div135 = element("div");
    			div135.textContent = "moved to Britain";
    			div136 = element("div");
    			t63 = text("for ");
    			a17 = element("a");
    			a17.textContent = "State.com";
    			t65 = text(" startup");
    			div140 = element("div");
    			div139 = element("div");
    			create_component(img71.$$.fragment);
    			div142 = element("div");
    			div141 = element("div");
    			div141.textContent = "'london in the rain is beautiful'";
    			create_component(img72.$$.fragment);
    			div143 = element("div");
    			create_component(img73.$$.fragment);
    			div147 = element("div");
    			div146 = element("div");
    			h211 = element("h2");
    			h211.textContent = "2011";
    			create_component(vimeo.$$.fragment);
    			div152 = element("div");
    			div151 = element("div");
    			h212 = element("h2");
    			h212.textContent = "2010";
    			div148 = element("div");
    			div148.textContent = "English Text simplification";
    			create_component(img74.$$.fragment);
    			ul3 = element("ul");
    			t70 = text("frequently cited as ");
    			i1 = element("i");
    			i1.textContent = "'the most naive' simplification of english";
    			div149 = element("div");
    			b = element("b");
    			b.textContent = "wikipedia bot";
    			t73 = text(" accepted on en.wikipedia");
    			div150 = element("div");
    			div150.textContent = "filled-in citation data until 2012.";
    			create_component(hr3.$$.fragment);
    			div171 = element("div");
    			div154 = element("div");
    			div153 = element("div");
    			div153.textContent = "citations:";
    			img75 = element("img");
    			ul20 = element("ul");
    			div155 = element("div");
    			create_component(dot0.$$.fragment);
    			a18 = element("a");
    			a18.textContent = "TensorFlow.js: Machine Learning for the Web and Beyond";
    			ul4 = element("ul");
    			ul4.textContent = "Google. 2019.";
    			div156 = element("div");
    			create_component(dot1.$$.fragment);
    			a19 = element("a");
    			a19.textContent = "Development of a web application for an automated user assistant";
    			ul5 = element("ul");
    			ul5.textContent = "the International Helenic University. 2018.";
    			div157 = element("div");
    			create_component(dot2.$$.fragment);
    			a20 = element("a");
    			a20.textContent = "Pronunciation Scaffolder: Annotation accuracy";
    			ul6 = element("ul");
    			ul6.textContent = "University of Aizu, Japan. 2018.";
    			div158 = element("div");
    			create_component(dot3.$$.fragment);
    			a21 = element("a");
    			a21.textContent = "Authentication Using Dynamic Question Generation";
    			ul7 = element("ul");
    			ul7.textContent = "Somaiya College OF Engineering, Mumbai. 2018.";
    			div159 = element("div");
    			create_component(dot4.$$.fragment);
    			a22 = element("a");
    			a22.textContent = "NETANOS - Named entity-based Text Anonymization for Open Science";
    			ul8 = element("ul");
    			ul8.textContent = "University of Amsterdam. 2017.";
    			div160 = element("div");
    			create_component(dot5.$$.fragment);
    			a23 = element("a");
    			a23.textContent = "Visualization of Thesaurus-Based Web Search";
    			ul9 = element("ul");
    			ul9.textContent = "Vienna University of Technology. 2017.";
    			div161 = element("div");
    			create_component(dot6.$$.fragment);
    			a24 = element("a");
    			a24.textContent = "Web Apps Come of Age for Molecular Sciences";
    			ul10 = element("ul");
    			ul10.textContent = "Swiss Federal Institute of Technology. 2017.";
    			div162 = element("div");
    			create_component(dot7.$$.fragment);
    			a25 = element("a");
    			a25.textContent = "Martello.io whitepaper";
    			ul11 = element("ul");
    			ul11.textContent = "National College of Ireland. 2017.";
    			div163 = element("div");
    			create_component(dot8.$$.fragment);
    			a26 = element("a");
    			a26.textContent = "Wikipedia graph data retrieval";
    			ul12 = element("ul");
    			ul12.textContent = "University of West Bohemia. 2016";
    			div164 = element("div");
    			create_component(dot9.$$.fragment);
    			a27 = element("a");
    			a27.textContent = "New Data-Driven Approaches to Text Simplification";
    			ul13 = element("ul");
    			ul13.textContent = "University of Wolverhampton. 2015.";
    			div165 = element("div");
    			create_component(dot10.$$.fragment);
    			a28 = element("a");
    			a28.textContent = "Learning to Simplify Children Stories with Limited Data";
    			ul14 = element("ul");
    			ul14.textContent = "Vietnam National University. 2014.";
    			div166 = element("div");
    			create_component(dot11.$$.fragment);
    			a29 = element("a");
    			a29.textContent = "SimpLe: Lexical Simplification using Word Sense Disambiguation";
    			ul15 = element("ul");
    			ul15.textContent = "York University, Toronto. 2013.";
    			div167 = element("div");
    			create_component(dot12.$$.fragment);
    			a30 = element("a");
    			a30.textContent = "WikiSimple: Automatic Simplification of Wikipedia Articles";
    			ul16 = element("ul");
    			ul16.textContent = "University of Edinburgh. 2011.";
    			div168 = element("div");
    			create_component(dot13.$$.fragment);
    			a31 = element("a");
    			a31.textContent = "Learning to Simplify Sentences with Quasi-Synchronous Grammar and Integer Programming";
    			ul17 = element("ul");
    			ul17.textContent = "University of Edinburgh. 2011";
    			div169 = element("div");
    			create_component(dot14.$$.fragment);
    			a32 = element("a");
    			a32.textContent = "The future of Search";
    			ul18 = element("ul");
    			ul18.textContent = "UC Berkeley. 2010.";
    			div170 = element("div");
    			create_component(dot15.$$.fragment);
    			a33 = element("a");
    			a33.textContent = "Unsupervised extraction of lexical simplifications Wikipedia";
    			ul19 = element("ul");
    			ul19.textContent = "Cornell. 2010.";
    			div172 = element("div");
    			div173 = element("div");
    			attr_dev(a0, "class", "cursor");
    			attr_dev(a0, "href", "../");
    			set_style(a0, "border-bottom", "1px solid transparent");
    			add_location(a0, file$6, 8, 68, 467);
    			add_location(div0, file$6, 8, 153, 552);
    			attr_dev(div1, "class", "mono f08 row i svelte-17l854g");
    			set_style(div1, "justify-content", "left");
    			add_location(div1, file$6, 8, 9, 408);
    			add_location(h20, file$6, 8, 233, 632);
    			attr_dev(div2, "class", "f09");
    			add_location(div2, file$6, 8, 467, 866);
    			add_location(div3, file$6, 8, 449, 848);
    			attr_dev(a1, "href", "https://github.com/spencermountain/compromise/compare/14.0.0...master");
    			add_location(a1, file$6, 8, 537, 936);
    			attr_dev(div4, "class", "f09 i");
    			add_location(div4, file$6, 8, 511, 910);
    			attr_dev(div5, "class", "half");
    			add_location(div5, file$6, 8, 631, 1030);
    			add_location(div6, file$6, 8, 317, 716);
    			attr_dev(div7, "class", "row");
    			set_style(div7, "justify-content", "flex-start");
    			set_style(div7, "margin-left", "2rem");
    			add_location(div7, file$6, 8, 246, 645);
    			attr_dev(div8, "class", "row");
    			set_style(div8, "max-width", "80%");
    			set_style(div8, "margin-right", "2rem");
    			set_style(div8, "padding-right", "6em");
    			add_location(div8, file$6, 8, 668, 1067);
    			add_location(div9, file$6, 8, 860, 1259);
    			attr_dev(div10, "class", "row");
    			add_location(div10, file$6, 8, 843, 1242);
    			attr_dev(a2, "href", "https://youtu.be/6DBDBcoMopQ?t=619");
    			add_location(a2, file$6, 8, 1118, 1517);
    			attr_dev(div11, "class", "tab f09");
    			add_location(div11, file$6, 8, 1194, 1593);
    			add_location(div12, file$6, 8, 1113, 1512);
    			attr_dev(div13, "class", "row");
    			set_style(div13, "justify-content", "flex-start");
    			add_location(div13, file$6, 8, 1005, 1404);
    			attr_dev(div14, "class", "row");
    			add_location(div14, file$6, 8, 1254, 1653);
    			attr_dev(a3, "href", "https://toronto.cityhallwatcher.com/p/chw196");
    			add_location(a3, file$6, 8, 1456, 1855);
    			attr_dev(div15, "class", "f09 tab");
    			add_location(div15, file$6, 8, 1540, 1939);
    			add_location(div16, file$6, 8, 1437, 1836);
    			attr_dev(div17, "class", "col");
    			set_style(div17, "padding", "1rem");
    			add_location(div17, file$6, 8, 1732, 2131);
    			attr_dev(div18, "class", "row");
    			set_style(div18, "flex-wrap", "nowrap");
    			set_style(div18, "justify-content", "flex-start");
    			add_location(div18, file$6, 8, 1608, 2007);
    			attr_dev(a4, "href", "https://github.com/spencermountain/fr-compromise");
    			add_location(a4, file$6, 8, 1976, 2375);
    			add_location(div19, file$6, 8, 1971, 2370);
    			attr_dev(a5, "href", "https://github.com/spencermountain/es-compromise");
    			add_location(a5, file$6, 8, 2056, 2455);
    			add_location(div20, file$6, 8, 2051, 2450);
    			attr_dev(a6, "href", "https://github.com/spencermountain/de-compromise");
    			add_location(a6, file$6, 8, 2137, 2536);
    			add_location(div21, file$6, 8, 2132, 2531);
    			attr_dev(a7, "href", "https://github.com/spencermountain/it-compromise");
    			add_location(a7, file$6, 8, 2217, 2616);
    			attr_dev(div22, "class", "tab");
    			add_location(div22, file$6, 8, 2287, 2686);
    			add_location(div23, file$6, 8, 2212, 2611);
    			add_location(div24, file$6, 8, 1966, 2365);
    			attr_dev(div25, "class", "row");
    			set_style(div25, "justify-content", "flex-end");
    			set_style(div25, "text-align", "right");
    			add_location(div25, file$6, 8, 1896, 2295);
    			attr_dev(div26, "class", "row");
    			set_style(div26, "justify-content", "flex-end");
    			set_style(div26, "text-align", "right");
    			add_location(div26, file$6, 8, 2488, 2887);
    			attr_dev(div27, "class", "col");
    			add_location(div27, file$6, 8, 2471, 2870);
    			attr_dev(div28, "class", "row");
    			set_style(div28, "justify-content", "flex-end");
    			set_style(div28, "text-align", "right");
    			add_location(div28, file$6, 8, 2401, 2800);
    			attr_dev(div29, "class", "row");
    			set_style(div29, "justify-content", "flex-end");
    			set_style(div29, "text-align", "right");
    			set_style(div29, "align-items", "flex-start");
    			add_location(div29, file$6, 8, 2631, 3030);
    			attr_dev(div30, "class", "year");
    			attr_dev(div30, "id", "2022");
    			add_location(div30, file$6, 8, 205, 604);
    			attr_dev(div31, "class", "main mt3");
    			add_location(div31, file$6, 8, 183, 582);
    			add_location(h21, file$6, 8, 2902, 3301);
    			add_location(div32, file$6, 8, 2994, 3393);
    			attr_dev(div33, "class", "half");
    			add_location(div33, file$6, 8, 2932, 3331);
    			attr_dev(div34, "class", "row");
    			add_location(div34, file$6, 8, 2915, 3314);
    			if (iframe.src !== (iframe_src_value = "https://player.vimeo.com/video/496095722?title=0&byline=0&portrait=0")) attr_dev(iframe, "src", iframe_src_value);
    			set_style(iframe, "position", "absolute");
    			set_style(iframe, "top", "0");
    			set_style(iframe, "left", "0");
    			set_style(iframe, "width", "100%");
    			set_style(iframe, "height", "100%");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "allow", "autoplay; fullscreen; picture-in-picture");
    			iframe.allowFullscreen = "";
    			add_location(iframe, file$6, 8, 3088, 3487);
    			if (script.src !== (script_src_value = "https://player.vimeo.com/api/player.js")) attr_dev(script, "src", script_src_value);
    			add_location(script, file$6, 8, 3335, 3734);
    			attr_dev(div35, "class", "mt4");
    			add_location(div35, file$6, 8, 3397, 3796);
    			set_style(div36, "padding", "56.25% 0 0 0");
    			set_style(div36, "position", "relative");
    			add_location(div36, file$6, 8, 3035, 3434);
    			attr_dev(div37, "class", "mt5");
    			add_location(div37, file$6, 8, 3446, 3845);
    			add_location(div38, file$6, 8, 3650, 4049);
    			attr_dev(div39, "class", "mt5");
    			add_location(div39, file$6, 8, 3469, 3868);
    			attr_dev(div40, "class", "mt5");
    			add_location(div40, file$6, 8, 3668, 4067);
    			attr_dev(div41, "class", "year");
    			attr_dev(div41, "id", "2021");
    			add_location(div41, file$6, 8, 2874, 3273);
    			attr_dev(div42, "class", "main mt3");
    			add_location(div42, file$6, 8, 2852, 3251);
    			add_location(h22, file$6, 8, 3874, 4273);
    			add_location(div43, file$6, 8, 4405, 4804);
    			attr_dev(a8, "href", "https://github.com/covidatlas/coronadatascraper");
    			add_location(a8, file$6, 8, 4491, 4890);
    			add_location(div44, file$6, 8, 4458, 4857);
    			attr_dev(a9, "href", "https://observablehq.com/@spencermountain/parsing-wikipedias-coronavirus-outbreak-data");
    			add_location(a9, file$6, 8, 4594, 4993);
    			add_location(div45, file$6, 8, 4562, 4961);
    			attr_dev(div46, "class", "f06 tab2 mono grey right orange svelte-17l854g");
    			set_style(div46, "text-align", "right");
    			add_location(div46, file$6, 8, 4335, 4734);
    			attr_dev(div47, "class", "mt4");
    			add_location(div47, file$6, 8, 4151, 4550);
    			attr_dev(div48, "class", "half");
    			add_location(div48, file$6, 8, 3904, 4303);
    			attr_dev(div49, "class", "half");
    			add_location(div49, file$6, 8, 4722, 5121);
    			attr_dev(div50, "class", "row");
    			add_location(div50, file$6, 8, 3887, 4286);
    			attr_dev(div51, "class", "m4");
    			add_location(div51, file$6, 8, 4924, 5323);
    			attr_dev(a10, "href", "https://www.stitcher.com/show/the-amateur/episode/how-to-learn-programming-68480006");
    			add_location(a10, file$6, 8, 5234, 5633);
    			attr_dev(div52, "class", "tab i f09");
    			add_location(div52, file$6, 8, 5182, 5581);
    			add_location(div53, file$6, 8, 5177, 5576);
    			attr_dev(div54, "class", "row");
    			add_location(div54, file$6, 8, 5160, 5559);
    			attr_dev(div55, "class", "mt4");
    			add_location(div55, file$6, 8, 5374, 5773);
    			attr_dev(div56, "class", "mt4");
    			add_location(div56, file$6, 8, 5669, 6068);
    			attr_dev(div57, "class", "half");
    			add_location(div57, file$6, 8, 5846, 6245);
    			attr_dev(div58, "class", "half");
    			add_location(div58, file$6, 8, 5982, 6381);
    			attr_dev(div59, "class", "row");
    			add_location(div59, file$6, 8, 5829, 6228);
    			attr_dev(div60, "class", "mt5");
    			add_location(div60, file$6, 8, 6251, 6650);
    			attr_dev(div61, "class", "year");
    			attr_dev(div61, "id", "2020");
    			add_location(div61, file$6, 8, 3846, 4245);
    			attr_dev(div62, "class", "main mt3");
    			add_location(div62, file$6, 8, 3824, 4223);
    			add_location(h23, file$6, 8, 6453, 6852);
    			attr_dev(div63, "class", "half");
    			add_location(div63, file$6, 8, 6483, 6882);
    			attr_dev(div64, "class", "half");
    			add_location(div64, file$6, 8, 6627, 7026);
    			attr_dev(div65, "class", "row");
    			add_location(div65, file$6, 8, 6466, 6865);
    			attr_dev(a11, "href", "http://mbihealthgroup.com/");
    			add_location(a11, file$6, 8, 7020, 7419);
    			attr_dev(div66, "class", "tab f09");
    			add_location(div66, file$6, 8, 6995, 7394);
    			attr_dev(ul0, "class", "i m4");
    			add_location(ul0, file$6, 8, 6949, 7348);
    			attr_dev(div67, "class", "row mt4");
    			add_location(div67, file$6, 8, 7083, 7482);
    			attr_dev(a12, "href", "https://venngage.com/");
    			add_location(a12, file$6, 8, 7350, 7749);
    			attr_dev(div68, "class", "tab f09");
    			add_location(div68, file$6, 8, 7325, 7724);
    			attr_dev(div69, "class", "i");
    			add_location(div69, file$6, 8, 7286, 7685);
    			add_location(div70, file$6, 8, 7281, 7680);
    			attr_dev(div71, "class", "tab row mt3");
    			set_style(div71, "justify-content", "normal");
    			add_location(div71, file$6, 8, 7223, 7622);
    			attr_dev(div72, "class", "year");
    			attr_dev(div72, "id", "2019");
    			add_location(div72, file$6, 8, 6425, 6824);
    			attr_dev(div73, "class", "main mt4");
    			add_location(div73, file$6, 8, 6403, 6802);
    			add_location(h24, file$6, 8, 7541, 7940);
    			attr_dev(div74, "class", "half");
    			add_location(div74, file$6, 8, 7571, 7970);
    			attr_dev(a13, "href", "https://begin.com");
    			add_location(a13, file$6, 8, 8086, 8485);
    			attr_dev(div75, "class", "i tab f09");
    			add_location(div75, file$6, 8, 8059, 8458);
    			add_location(ul1, file$6, 8, 8021, 8420);
    			attr_dev(div76, "class", "half");
    			add_location(div76, file$6, 8, 7824, 8223);
    			attr_dev(div77, "class", "row");
    			add_location(div77, file$6, 8, 7554, 7953);
    			attr_dev(div78, "class", "half");
    			add_location(div78, file$6, 8, 8171, 8570);
    			add_location(div79, file$6, 8, 8435, 8834);
    			attr_dev(div80, "class", "i");
    			add_location(div80, file$6, 8, 8464, 8863);
    			attr_dev(div81, "class", "half");
    			add_location(div81, file$6, 8, 8417, 8816);
    			attr_dev(div82, "class", "row mt4");
    			add_location(div82, file$6, 8, 8150, 8549);
    			attr_dev(div83, "class", "tab2");
    			add_location(div83, file$6, 8, 8507, 8906);
    			attr_dev(div84, "class", "year");
    			attr_dev(div84, "id", "2018");
    			add_location(div84, file$6, 8, 7513, 7912);
    			attr_dev(div85, "class", "main mt4");
    			add_location(div85, file$6, 8, 7491, 7890);
    			add_location(h25, file$6, 8, 8658, 9057);
    			attr_dev(div86, "class", "mt2");
    			add_location(div86, file$6, 8, 8946, 9345);
    			attr_dev(div87, "class", "mt3");
    			add_location(div87, file$6, 8, 9034, 9433);
    			attr_dev(div88, "class", "half");
    			add_location(div88, file$6, 8, 8856, 9255);
    			attr_dev(div89, "class", "half");
    			add_location(div89, file$6, 8, 9252, 9651);
    			attr_dev(div90, "class", "row mt3");
    			add_location(div90, file$6, 8, 8835, 9234);
    			attr_dev(a14, "href", "https://devblogs.microsoft.com/cse/2017/06/06/geocoding-social-conversations-nlp-javascript/");
    			add_location(a14, file$6, 8, 9560, 9959);
    			attr_dev(div91, "class", "mt5 ml3");
    			add_location(div91, file$6, 8, 9521, 9920);
    			attr_dev(div92, "class", "year");
    			attr_dev(div92, "id", "2017");
    			add_location(div92, file$6, 8, 8630, 9029);
    			attr_dev(div93, "class", "main mt5");
    			add_location(div93, file$6, 8, 8608, 9007);
    			add_location(h26, file$6, 8, 9765, 10164);
    			attr_dev(div94, "class", "mt2");
    			add_location(div94, file$6, 8, 9877, 10276);
    			attr_dev(div95, "class", "half");
    			add_location(div95, file$6, 8, 9795, 10194);
    			attr_dev(div96, "class", "half");
    			add_location(div96, file$6, 8, 9979, 10378);
    			attr_dev(div97, "class", "row");
    			add_location(div97, file$6, 8, 9778, 10177);
    			attr_dev(div98, "class", "mt3");
    			add_location(div98, file$6, 8, 10073, 10472);
    			attr_dev(div99, "class", "mt3");
    			add_location(div99, file$6, 8, 10154, 10553);
    			attr_dev(div100, "class", "half");
    			add_location(div100, file$6, 8, 10240, 10639);
    			attr_dev(div101, "class", "mt3");
    			add_location(div101, file$6, 8, 10282, 10681);
    			attr_dev(div102, "class", "half");
    			add_location(div102, file$6, 8, 10264, 10663);
    			attr_dev(div103, "class", "row nowrap");
    			add_location(div103, file$6, 8, 10216, 10615);
    			attr_dev(div104, "class", "year");
    			attr_dev(div104, "id", "2016");
    			add_location(div104, file$6, 8, 9737, 10136);
    			attr_dev(div105, "class", "main mt5");
    			add_location(div105, file$6, 8, 9715, 10114);
    			add_location(h27, file$6, 8, 10458, 10857);
    			attr_dev(a15, "href", "https://govinvest.com/");
    			add_location(a15, file$6, 8, 10674, 11073);
    			attr_dev(div106, "class", "right mt2 f09");
    			add_location(div106, file$6, 8, 10620, 11019);
    			attr_dev(div107, "class", "tab");
    			add_location(div107, file$6, 8, 10794, 11193);
    			attr_dev(div108, "class", "mt3");
    			add_location(div108, file$6, 8, 10889, 11288);
    			attr_dev(div109, "class", "year");
    			attr_dev(div109, "id", "2015");
    			add_location(div109, file$6, 8, 10430, 10829);
    			attr_dev(div110, "class", "main mt5");
    			add_location(div110, file$6, 8, 10407, 10806);
    			add_location(h28, file$6, 8, 11092, 11491);
    			add_location(div111, file$6, 8, 11105, 11504);
    			attr_dev(div112, "class", "half");
    			add_location(div112, file$6, 8, 11170, 11569);
    			attr_dev(div113, "class", "mt2");
    			add_location(div113, file$6, 8, 11283, 11682);
    			attr_dev(div114, "class", "half");
    			add_location(div114, file$6, 8, 11265, 11664);
    			attr_dev(div115, "class", "row");
    			add_location(div115, file$6, 8, 11153, 11552);
    			attr_dev(a16, "href", "https://patents.google.com/patent/US20150089409A1/en");
    			add_location(a16, file$6, 8, 11448, 11847);
    			attr_dev(ul2, "class", "mt4 i");
    			add_location(ul2, file$6, 8, 11396, 11795);
    			attr_dev(div116, "class", "half");
    			set_style(div116, "width", "230px");
    			add_location(div116, file$6, 8, 11614, 12013);
    			attr_dev(div117, "class", "f09 i grey");
    			add_location(div117, file$6, 8, 11828, 12227);
    			attr_dev(div118, "class", "half ml1");
    			add_location(div118, file$6, 8, 11733, 12132);
    			attr_dev(div119, "class", "row mt3");
    			add_location(div119, file$6, 8, 11593, 11992);
    			attr_dev(div120, "class", "year");
    			attr_dev(div120, "id", "2014");
    			add_location(div120, file$6, 8, 11064, 11463);
    			attr_dev(div121, "class", "main mt5");
    			add_location(div121, file$6, 8, 11041, 11440);
    			add_location(h29, file$6, 8, 12053, 12452);
    			attr_dev(div122, "class", "half");
    			add_location(div122, file$6, 8, 12083, 12482);
    			attr_dev(div123, "class", "half");
    			add_location(div123, file$6, 8, 12189, 12588);
    			attr_dev(div124, "class", "row");
    			add_location(div124, file$6, 8, 12066, 12465);
    			attr_dev(div125, "class", "i f09 tab");
    			add_location(div125, file$6, 8, 12395, 12794);
    			attr_dev(div126, "class", "tab mt5");
    			add_location(div126, file$6, 8, 12349, 12748);
    			add_location(i0, file$6, 8, 12627, 13026);
    			attr_dev(div127, "class", "hangright mt5");
    			add_location(div127, file$6, 8, 12581, 12980);
    			attr_dev(div128, "class", "m3");
    			add_location(div128, file$6, 8, 12660, 13059);
    			add_location(div129, file$6, 8, 12856, 13255);
    			add_location(div130, file$6, 8, 12887, 13286);
    			attr_dev(div131, "class", "tab i f09 ml4 mt3");
    			add_location(div131, file$6, 8, 12825, 13224);
    			attr_dev(div132, "class", "year");
    			attr_dev(div132, "id", "2013");
    			add_location(div132, file$6, 8, 12025, 12424);
    			attr_dev(div133, "class", "main mt5");
    			add_location(div133, file$6, 8, 12003, 12402);
    			add_location(h210, file$6, 8, 12997, 13396);
    			attr_dev(div134, "class", "half");
    			add_location(div134, file$6, 8, 13027, 13426);
    			add_location(div135, file$6, 8, 13136, 13535);
    			attr_dev(a17, "href", "https://state.com/");
    			add_location(a17, file$6, 8, 13190, 13589);
    			attr_dev(div136, "class", "tab i f09");
    			add_location(div136, file$6, 8, 13163, 13562);
    			attr_dev(div137, "class", "half");
    			add_location(div137, file$6, 8, 13118, 13517);
    			attr_dev(div138, "class", "row");
    			add_location(div138, file$6, 8, 13010, 13409);
    			attr_dev(div139, "class", "right");
    			add_location(div139, file$6, 8, 13275, 13674);
    			attr_dev(div140, "class", "mt3");
    			add_location(div140, file$6, 8, 13258, 13657);
    			attr_dev(div141, "class", "i f09");
    			set_style(div141, "text-align", "right");
    			set_style(div141, "margin-right", "3rem");
    			add_location(div141, file$6, 8, 13376, 13775);
    			attr_dev(div142, "class", "mt3");
    			add_location(div142, file$6, 8, 13359, 13758);
    			attr_dev(div143, "class", "mt3");
    			add_location(div143, file$6, 8, 13542, 13941);
    			attr_dev(div144, "class", "year");
    			attr_dev(div144, "id", "2012");
    			add_location(div144, file$6, 8, 12969, 13368);
    			attr_dev(div145, "class", "main mt5");
    			add_location(div145, file$6, 8, 12946, 13345);
    			add_location(h211, file$6, 8, 13731, 14130);
    			attr_dev(div146, "class", "year");
    			attr_dev(div146, "id", "2011");
    			set_style(div146, "width", "100%");
    			set_style(div146, "max-width", "600px");
    			add_location(div146, file$6, 8, 13665, 14064);
    			attr_dev(div147, "class", "main mt5");
    			add_location(div147, file$6, 8, 13642, 14041);
    			add_location(h212, file$6, 8, 13839, 14238);
    			add_location(div148, file$6, 8, 13852, 14251);
    			add_location(i1, file$6, 8, 14078, 14477);
    			add_location(ul3, file$6, 8, 14054, 14453);
    			add_location(b, file$6, 8, 14158, 14557);
    			attr_dev(div149, "class", "mt4 ml2 navy");
    			add_location(div149, file$6, 8, 14132, 14531);
    			attr_dev(div150, "class", "ml4 i");
    			add_location(div150, file$6, 8, 14209, 14608);
    			attr_dev(div151, "class", "year");
    			attr_dev(div151, "id", "2010");
    			add_location(div151, file$6, 8, 13811, 14210);
    			attr_dev(div152, "class", "main mt5");
    			add_location(div152, file$6, 8, 13788, 14187);
    			attr_dev(div153, "class", "f2");
    			add_location(div153, file$6, 8, 14362, 14761);
    			attr_dev(img75, "class", "ml3");
    			if (img75.src !== (img75_src_value = "./assets/2010/piano.gif")) attr_dev(img75, "src", img75_src_value);
    			add_location(img75, file$6, 8, 14394, 14793);
    			attr_dev(div154, "class", "row");
    			set_style(div154, "justify-content", "normal");
    			add_location(div154, file$6, 8, 14312, 14711);
    			attr_dev(a18, "href", "https://arxiv.org/abs/1901.05350");
    			add_location(a18, file$6, 8, 14489, 14888);
    			add_location(ul4, file$6, 8, 14590, 14989);
    			add_location(div155, file$6, 8, 14452, 14851);
    			attr_dev(a19, "href", "https://repository.ihu.edu.gr//xmlui/handle/11544/29186");
    			add_location(a19, file$6, 8, 14655, 15054);
    			add_location(ul5, file$6, 8, 14789, 15188);
    			add_location(div156, file$6, 8, 14618, 15017);
    			attr_dev(a20, "href", "https://www.isca-speech.org/archive/ISAPh_2018/pdfs/18.pdf");
    			add_location(a20, file$6, 8, 14884, 15283);
    			add_location(ul6, file$6, 8, 15002, 15401);
    			add_location(div157, file$6, 8, 14847, 15246);
    			attr_dev(a21, "href", "https://link.springer.com/chapter/10.1007/978-981-10-8797-4_31");
    			add_location(a21, file$6, 8, 15086, 15485);
    			add_location(ul7, file$6, 8, 15211, 15610);
    			add_location(div158, file$6, 8, 15049, 15448);
    			attr_dev(a22, "href", "https://osf.io/w9nhb");
    			add_location(a22, file$6, 8, 15308, 15707);
    			add_location(ul8, file$6, 8, 15407, 15806);
    			add_location(div159, file$6, 8, 15271, 15670);
    			attr_dev(a23, "href", "https://www.cg.tuwien.ac.at/research/publications/2017/mazurek-2017-vows/mazurek-2017-vows-report.pdf");
    			add_location(a23, file$6, 8, 15489, 15888);
    			add_location(ul9, file$6, 8, 15648, 16047);
    			add_location(div160, file$6, 8, 15452, 15851);
    			attr_dev(a24, "href", "https://www.mdpi.com/2227-9709/4/3/28/htm");
    			add_location(a24, file$6, 8, 15738, 16137);
    			add_location(ul10, file$6, 8, 15837, 16236);
    			add_location(div161, file$6, 8, 15701, 16100);
    			attr_dev(a25, "href", "https://core.ac.uk/download/pdf/132597718.pdf");
    			add_location(a25, file$6, 8, 15933, 16332);
    			add_location(ul11, file$6, 8, 16015, 16414);
    			add_location(div162, file$6, 8, 15896, 16295);
    			attr_dev(a26, "href", "https://otik.uk.zcu.cz/handle/11025/23829");
    			add_location(a26, file$6, 8, 16100, 16499);
    			add_location(ul12, file$6, 8, 16186, 16585);
    			add_location(div163, file$6, 8, 16064, 16463);
    			attr_dev(a27, "href", "https://wlv.openrepository.com/bitstream/handle/2436/601113/Stajner_PhD+thesis.pdf?sequence=1");
    			add_location(a27, file$6, 8, 16266, 16665);
    			add_location(ul13, file$6, 8, 16423, 16822);
    			add_location(div164, file$6, 8, 16233, 16632);
    			attr_dev(a28, "href", "http://l3s.de/~gtran/publications/vu_et_al_2014.pdf");
    			add_location(a28, file$6, 8, 16505, 16904);
    			add_location(ul14, file$6, 8, 16626, 17025);
    			add_location(div165, file$6, 8, 16472, 16871);
    			attr_dev(a29, "href", "https://wiki.eecs.yorku.ca/course_archive/2013-14/W/6339/_media/simple_book.pdf");
    			add_location(a29, file$6, 8, 16708, 17107);
    			add_location(ul15, file$6, 8, 16864, 17263);
    			add_location(div166, file$6, 8, 16675, 17074);
    			attr_dev(a30, "href", "https://www.semanticscholar.org/paper/WikiSimple%3A-Automatic-Simplification-of-Wikipedia-Woodsend-Lapata/e4c71fd504fd6657fc444e82e481b22f952bcaab");
    			add_location(a30, file$6, 8, 16943, 17342);
    			add_location(ul16, file$6, 8, 17162, 17561);
    			add_location(div167, file$6, 8, 16910, 17309);
    			attr_dev(a31, "href", "https://dl.acm.org/citation.cfm?id=2145480");
    			add_location(a31, file$6, 8, 17240, 17639);
    			add_location(ul17, file$6, 8, 17382, 17781);
    			add_location(div168, file$6, 8, 17207, 17606);
    			attr_dev(a32, "href", "https://www.slideshare.net/marti_hearst/the-future-of-search-keynote-at-iknow-2010");
    			add_location(a32, file$6, 8, 17461, 17860);
    			add_location(ul18, file$6, 8, 17578, 17977);
    			add_location(div169, file$6, 8, 17426, 17825);
    			attr_dev(a33, "href", "https://dl.acm.org/citation.cfm?id=1858055");
    			add_location(a33, file$6, 8, 17644, 18043);
    			add_location(ul19, file$6, 8, 17761, 18160);
    			add_location(div170, file$6, 8, 17611, 18010);
    			add_location(ul20, file$6, 8, 14448, 14847);
    			attr_dev(div171, "class", "main mt4");
    			add_location(div171, file$6, 8, 14290, 14689);
    			attr_dev(div172, "class", "space");
    			add_location(div172, file$6, 8, 17801, 18200);
    			attr_dev(div173, "class", "space");
    			add_location(div173, file$6, 8, 17826, 18225);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a0);
    			append_dev(div1, div0);
    			insert_dev(target, div31, anchor);
    			append_dev(div31, div30);
    			append_dev(div30, h20);
    			append_dev(div30, div7);
    			append_dev(div7, div6);
    			mount_component(img0, div6, null);
    			append_dev(div6, div3);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div6, div4);
    			append_dev(div4, t5);
    			append_dev(div4, a1);
    			append_dev(div6, div5);
    			append_dev(div30, div8);
    			mount_component(img1, div8, null);
    			append_dev(div30, div10);
    			append_dev(div10, div9);
    			mount_component(img2, div9, null);
    			mount_component(img3, div9, null);
    			append_dev(div30, div13);
    			mount_component(img4, div13, null);
    			append_dev(div13, div12);
    			append_dev(div12, a2);
    			append_dev(div12, t8);
    			append_dev(div12, div11);
    			append_dev(div30, div14);
    			mount_component(img5, div14, null);
    			mount_component(img6, div30, null);
    			append_dev(div30, div16);
    			append_dev(div16, t10);
    			append_dev(div16, a3);
    			append_dev(div16, div15);
    			append_dev(div30, div18);
    			mount_component(img7, div18, null);
    			append_dev(div18, div17);
    			mount_component(img8, div17, null);
    			mount_component(img9, div17, null);
    			append_dev(div30, div25);
    			append_dev(div25, div24);
    			append_dev(div24, div19);
    			append_dev(div19, a4);
    			append_dev(div24, div20);
    			append_dev(div20, a5);
    			append_dev(div24, div21);
    			append_dev(div21, a6);
    			append_dev(div24, div23);
    			append_dev(div23, a7);
    			append_dev(div23, div22);
    			mount_component(img10, div25, null);
    			append_dev(div30, div28);
    			append_dev(div28, div27);
    			append_dev(div27, div26);
    			mount_component(img11, div26, null);
    			append_dev(div30, div29);
    			mount_component(img12, div29, null);
    			mount_component(img13, div29, null);
    			insert_dev(target, div42, anchor);
    			append_dev(div42, div41);
    			append_dev(div41, h21);
    			append_dev(div41, div34);
    			append_dev(div34, div33);
    			mount_component(img14, div33, null);
    			append_dev(div33, div32);
    			append_dev(div41, div36);
    			append_dev(div36, iframe);
    			append_dev(div36, script);
    			append_dev(div36, div35);
    			append_dev(div41, div37);
    			append_dev(div41, div39);
    			mount_component(img15, div39, null);
    			append_dev(div39, div38);
    			append_dev(div41, div40);
    			mount_component(img16, div40, null);
    			insert_dev(target, div62, anchor);
    			append_dev(div62, div61);
    			append_dev(div61, h22);
    			append_dev(div61, div50);
    			append_dev(div50, div48);
    			mount_component(img17, div48, null);
    			mount_component(img18, div48, null);
    			append_dev(div48, div47);
    			mount_component(img19, div47, null);
    			append_dev(div47, div46);
    			append_dev(div46, div43);
    			append_dev(div46, div44);
    			append_dev(div44, t23);
    			append_dev(div44, a8);
    			append_dev(div46, div45);
    			append_dev(div45, t25);
    			append_dev(div45, a9);
    			append_dev(div50, div49);
    			mount_component(img20, div49, null);
    			mount_component(img21, div49, null);
    			append_dev(div61, div51);
    			mount_component(img22, div51, null);
    			append_dev(div61, div54);
    			append_dev(div54, div53);
    			append_dev(div53, div52);
    			append_dev(div52, t27);
    			append_dev(div52, a10);
    			append_dev(div61, div55);
    			mount_component(mov0, div55, null);
    			append_dev(div61, div56);
    			mount_component(mov1, div56, null);
    			append_dev(div61, div59);
    			append_dev(div59, div57);
    			mount_component(img23, div57, null);
    			mount_component(img24, div57, null);
    			append_dev(div59, div58);
    			mount_component(img25, div58, null);
    			mount_component(img26, div58, null);
    			append_dev(div61, div60);
    			mount_component(img27, div60, null);
    			insert_dev(target, div73, anchor);
    			append_dev(div73, div72);
    			append_dev(div72, h23);
    			append_dev(div72, div65);
    			append_dev(div65, div63);
    			mount_component(img28, div63, null);
    			append_dev(div65, div64);
    			mount_component(img29, div64, null);
    			mount_component(img30, div64, null);
    			mount_component(img31, div64, null);
    			append_dev(div72, ul0);
    			append_dev(ul0, t30);
    			append_dev(ul0, div66);
    			append_dev(div66, t31);
    			append_dev(div66, a11);
    			append_dev(div66, t33);
    			append_dev(div72, div67);
    			mount_component(img32, div67, null);
    			mount_component(img33, div67, null);
    			append_dev(div72, div71);
    			append_dev(div71, div70);
    			append_dev(div70, div69);
    			append_dev(div69, t34);
    			append_dev(div69, div68);
    			append_dev(div68, t35);
    			append_dev(div68, a12);
    			mount_component(img34, div71, null);
    			insert_dev(target, div85, anchor);
    			append_dev(div85, div84);
    			append_dev(div84, h24);
    			append_dev(div84, div77);
    			append_dev(div77, div74);
    			mount_component(img35, div74, null);
    			mount_component(img36, div74, null);
    			append_dev(div77, div76);
    			mount_component(img37, div76, null);
    			mount_component(img38, div76, null);
    			append_dev(div76, ul1);
    			append_dev(ul1, t38);
    			append_dev(ul1, div75);
    			append_dev(div75, t39);
    			append_dev(div75, a13);
    			append_dev(div84, div82);
    			append_dev(div82, div78);
    			mount_component(img39, div78, null);
    			mount_component(img40, div78, null);
    			append_dev(div82, div81);
    			append_dev(div81, div79);
    			append_dev(div81, div80);
    			append_dev(div84, div83);
    			mount_component(img41, div83, null);
    			mount_component(hr0, div84, null);
    			insert_dev(target, div93, anchor);
    			append_dev(div93, div92);
    			append_dev(div92, h25);
    			mount_component(img42, div92, null);
    			append_dev(div92, div90);
    			append_dev(div90, div88);
    			mount_component(img43, div88, null);
    			append_dev(div88, div86);
    			mount_component(img44, div86, null);
    			append_dev(div88, div87);
    			mount_component(img45, div87, null);
    			append_dev(div90, div89);
    			mount_component(img46, div89, null);
    			mount_component(img47, div89, null);
    			append_dev(div92, div91);
    			append_dev(div91, t44);
    			append_dev(div91, a14);
    			mount_component(hr1, div92, null);
    			insert_dev(target, div105, anchor);
    			append_dev(div105, div104);
    			append_dev(div104, h26);
    			append_dev(div104, div97);
    			append_dev(div97, div95);
    			mount_component(img48, div95, null);
    			append_dev(div95, div94);
    			mount_component(img49, div94, null);
    			append_dev(div97, div96);
    			mount_component(img50, div96, null);
    			append_dev(div104, div98);
    			mount_component(img51, div98, null);
    			append_dev(div104, div99);
    			mount_component(youtube, div99, null);
    			append_dev(div104, div103);
    			append_dev(div103, div100);
    			append_dev(div103, div102);
    			append_dev(div102, div101);
    			mount_component(img52, div101, null);
    			mount_component(hr2, div104, null);
    			insert_dev(target, div110, anchor);
    			append_dev(div110, div109);
    			append_dev(div109, h27);
    			mount_component(img53, div109, null);
    			mount_component(img54, div109, null);
    			append_dev(div109, div106);
    			append_dev(div106, t48);
    			append_dev(div106, a15);
    			mount_component(img55, div109, null);
    			append_dev(div109, div107);
    			mount_component(img56, div107, null);
    			append_dev(div109, div108);
    			mount_component(img57, div108, null);
    			insert_dev(target, div121, anchor);
    			append_dev(div121, div120);
    			append_dev(div120, h28);
    			append_dev(div120, div111);
    			append_dev(div120, div115);
    			append_dev(div115, div112);
    			mount_component(img58, div112, null);
    			append_dev(div115, div114);
    			append_dev(div114, div113);
    			mount_component(img59, div113, null);
    			append_dev(div120, ul2);
    			append_dev(ul2, t52);
    			append_dev(ul2, a16);
    			mount_component(img60, a16, null);
    			append_dev(div120, div119);
    			append_dev(div119, div116);
    			mount_component(img61, div116, null);
    			append_dev(div119, div118);
    			mount_component(img62, div118, null);
    			append_dev(div118, div117);
    			mount_component(img63, div118, null);
    			insert_dev(target, div133, anchor);
    			append_dev(div133, div132);
    			append_dev(div132, h29);
    			append_dev(div132, div124);
    			append_dev(div124, div122);
    			mount_component(img64, div122, null);
    			append_dev(div124, div123);
    			mount_component(img65, div123, null);
    			mount_component(img66, div123, null);
    			append_dev(div132, div126);
    			append_dev(div126, t55);
    			append_dev(div126, div125);
    			mount_component(img67, div126, null);
    			append_dev(div132, div127);
    			append_dev(div127, t57);
    			append_dev(div127, i0);
    			append_dev(div132, div128);
    			mount_component(img68, div128, null);
    			mount_component(img69, div132, null);
    			append_dev(div132, div131);
    			append_dev(div131, div129);
    			append_dev(div131, div130);
    			insert_dev(target, div145, anchor);
    			append_dev(div145, div144);
    			append_dev(div144, h210);
    			append_dev(div144, div138);
    			append_dev(div138, div134);
    			mount_component(img70, div134, null);
    			append_dev(div138, div137);
    			append_dev(div137, div135);
    			append_dev(div137, div136);
    			append_dev(div136, t63);
    			append_dev(div136, a17);
    			append_dev(div136, t65);
    			append_dev(div144, div140);
    			append_dev(div140, div139);
    			mount_component(img71, div139, null);
    			append_dev(div144, div142);
    			append_dev(div142, div141);
    			mount_component(img72, div142, null);
    			append_dev(div144, div143);
    			mount_component(img73, div143, null);
    			insert_dev(target, div147, anchor);
    			append_dev(div147, div146);
    			append_dev(div146, h211);
    			mount_component(vimeo, div146, null);
    			insert_dev(target, div152, anchor);
    			append_dev(div152, div151);
    			append_dev(div151, h212);
    			append_dev(div151, div148);
    			mount_component(img74, div151, null);
    			append_dev(div151, ul3);
    			append_dev(ul3, t70);
    			append_dev(ul3, i1);
    			append_dev(div151, div149);
    			append_dev(div149, b);
    			append_dev(div149, t73);
    			append_dev(div151, div150);
    			mount_component(hr3, div152, null);
    			insert_dev(target, div171, anchor);
    			append_dev(div171, div154);
    			append_dev(div154, div153);
    			append_dev(div154, img75);
    			append_dev(div171, ul20);
    			append_dev(ul20, div155);
    			mount_component(dot0, div155, null);
    			append_dev(div155, a18);
    			append_dev(div155, ul4);
    			append_dev(ul20, div156);
    			mount_component(dot1, div156, null);
    			append_dev(div156, a19);
    			append_dev(div156, ul5);
    			append_dev(ul20, div157);
    			mount_component(dot2, div157, null);
    			append_dev(div157, a20);
    			append_dev(div157, ul6);
    			append_dev(ul20, div158);
    			mount_component(dot3, div158, null);
    			append_dev(div158, a21);
    			append_dev(div158, ul7);
    			append_dev(ul20, div159);
    			mount_component(dot4, div159, null);
    			append_dev(div159, a22);
    			append_dev(div159, ul8);
    			append_dev(ul20, div160);
    			mount_component(dot5, div160, null);
    			append_dev(div160, a23);
    			append_dev(div160, ul9);
    			append_dev(ul20, div161);
    			mount_component(dot6, div161, null);
    			append_dev(div161, a24);
    			append_dev(div161, ul10);
    			append_dev(ul20, div162);
    			mount_component(dot7, div162, null);
    			append_dev(div162, a25);
    			append_dev(div162, ul11);
    			append_dev(ul20, div163);
    			mount_component(dot8, div163, null);
    			append_dev(div163, a26);
    			append_dev(div163, ul12);
    			append_dev(ul20, div164);
    			mount_component(dot9, div164, null);
    			append_dev(div164, a27);
    			append_dev(div164, ul13);
    			append_dev(ul20, div165);
    			mount_component(dot10, div165, null);
    			append_dev(div165, a28);
    			append_dev(div165, ul14);
    			append_dev(ul20, div166);
    			mount_component(dot11, div166, null);
    			append_dev(div166, a29);
    			append_dev(div166, ul15);
    			append_dev(ul20, div167);
    			mount_component(dot12, div167, null);
    			append_dev(div167, a30);
    			append_dev(div167, ul16);
    			append_dev(ul20, div168);
    			mount_component(dot13, div168, null);
    			append_dev(div168, a31);
    			append_dev(div168, ul17);
    			append_dev(ul20, div169);
    			mount_component(dot14, div169, null);
    			append_dev(div169, a32);
    			append_dev(div169, ul18);
    			append_dev(ul20, div170);
    			mount_component(dot15, div170, null);
    			append_dev(div170, a33);
    			append_dev(div170, ul19);
    			insert_dev(target, div172, anchor);
    			insert_dev(target, div173, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const img55_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				img55_changes.$$scope = { dirty, ctx };
    			}

    			img55.$set(img55_changes);
    			const img56_changes = {};

    			if (dirty & /*$$scope*/ 1) {
    				img56_changes.$$scope = { dirty, ctx };
    			}

    			img56.$set(img56_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(img0.$$.fragment, local);
    			transition_in(img1.$$.fragment, local);
    			transition_in(img2.$$.fragment, local);
    			transition_in(img3.$$.fragment, local);
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
    			transition_in(mov0.$$.fragment, local);
    			transition_in(mov1.$$.fragment, local);
    			transition_in(img23.$$.fragment, local);
    			transition_in(img24.$$.fragment, local);
    			transition_in(img25.$$.fragment, local);
    			transition_in(img26.$$.fragment, local);
    			transition_in(img27.$$.fragment, local);
    			transition_in(img28.$$.fragment, local);
    			transition_in(img29.$$.fragment, local);
    			transition_in(img30.$$.fragment, local);
    			transition_in(img31.$$.fragment, local);
    			transition_in(img32.$$.fragment, local);
    			transition_in(img33.$$.fragment, local);
    			transition_in(img34.$$.fragment, local);
    			transition_in(img35.$$.fragment, local);
    			transition_in(img36.$$.fragment, local);
    			transition_in(img37.$$.fragment, local);
    			transition_in(img38.$$.fragment, local);
    			transition_in(img39.$$.fragment, local);
    			transition_in(img40.$$.fragment, local);
    			transition_in(img41.$$.fragment, local);
    			transition_in(hr0.$$.fragment, local);
    			transition_in(img42.$$.fragment, local);
    			transition_in(img43.$$.fragment, local);
    			transition_in(img44.$$.fragment, local);
    			transition_in(img45.$$.fragment, local);
    			transition_in(img46.$$.fragment, local);
    			transition_in(img47.$$.fragment, local);
    			transition_in(hr1.$$.fragment, local);
    			transition_in(img48.$$.fragment, local);
    			transition_in(img49.$$.fragment, local);
    			transition_in(img50.$$.fragment, local);
    			transition_in(img51.$$.fragment, local);
    			transition_in(youtube.$$.fragment, local);
    			transition_in(img52.$$.fragment, local);
    			transition_in(hr2.$$.fragment, local);
    			transition_in(img53.$$.fragment, local);
    			transition_in(img54.$$.fragment, local);
    			transition_in(img55.$$.fragment, local);
    			transition_in(img56.$$.fragment, local);
    			transition_in(img57.$$.fragment, local);
    			transition_in(img58.$$.fragment, local);
    			transition_in(img59.$$.fragment, local);
    			transition_in(img60.$$.fragment, local);
    			transition_in(img61.$$.fragment, local);
    			transition_in(img62.$$.fragment, local);
    			transition_in(img63.$$.fragment, local);
    			transition_in(img64.$$.fragment, local);
    			transition_in(img65.$$.fragment, local);
    			transition_in(img66.$$.fragment, local);
    			transition_in(img67.$$.fragment, local);
    			transition_in(img68.$$.fragment, local);
    			transition_in(img69.$$.fragment, local);
    			transition_in(img70.$$.fragment, local);
    			transition_in(img71.$$.fragment, local);
    			transition_in(img72.$$.fragment, local);
    			transition_in(img73.$$.fragment, local);
    			transition_in(vimeo.$$.fragment, local);
    			transition_in(img74.$$.fragment, local);
    			transition_in(hr3.$$.fragment, local);
    			transition_in(dot0.$$.fragment, local);
    			transition_in(dot1.$$.fragment, local);
    			transition_in(dot2.$$.fragment, local);
    			transition_in(dot3.$$.fragment, local);
    			transition_in(dot4.$$.fragment, local);
    			transition_in(dot5.$$.fragment, local);
    			transition_in(dot6.$$.fragment, local);
    			transition_in(dot7.$$.fragment, local);
    			transition_in(dot8.$$.fragment, local);
    			transition_in(dot9.$$.fragment, local);
    			transition_in(dot10.$$.fragment, local);
    			transition_in(dot11.$$.fragment, local);
    			transition_in(dot12.$$.fragment, local);
    			transition_in(dot13.$$.fragment, local);
    			transition_in(dot14.$$.fragment, local);
    			transition_in(dot15.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(img0.$$.fragment, local);
    			transition_out(img1.$$.fragment, local);
    			transition_out(img2.$$.fragment, local);
    			transition_out(img3.$$.fragment, local);
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
    			transition_out(mov0.$$.fragment, local);
    			transition_out(mov1.$$.fragment, local);
    			transition_out(img23.$$.fragment, local);
    			transition_out(img24.$$.fragment, local);
    			transition_out(img25.$$.fragment, local);
    			transition_out(img26.$$.fragment, local);
    			transition_out(img27.$$.fragment, local);
    			transition_out(img28.$$.fragment, local);
    			transition_out(img29.$$.fragment, local);
    			transition_out(img30.$$.fragment, local);
    			transition_out(img31.$$.fragment, local);
    			transition_out(img32.$$.fragment, local);
    			transition_out(img33.$$.fragment, local);
    			transition_out(img34.$$.fragment, local);
    			transition_out(img35.$$.fragment, local);
    			transition_out(img36.$$.fragment, local);
    			transition_out(img37.$$.fragment, local);
    			transition_out(img38.$$.fragment, local);
    			transition_out(img39.$$.fragment, local);
    			transition_out(img40.$$.fragment, local);
    			transition_out(img41.$$.fragment, local);
    			transition_out(hr0.$$.fragment, local);
    			transition_out(img42.$$.fragment, local);
    			transition_out(img43.$$.fragment, local);
    			transition_out(img44.$$.fragment, local);
    			transition_out(img45.$$.fragment, local);
    			transition_out(img46.$$.fragment, local);
    			transition_out(img47.$$.fragment, local);
    			transition_out(hr1.$$.fragment, local);
    			transition_out(img48.$$.fragment, local);
    			transition_out(img49.$$.fragment, local);
    			transition_out(img50.$$.fragment, local);
    			transition_out(img51.$$.fragment, local);
    			transition_out(youtube.$$.fragment, local);
    			transition_out(img52.$$.fragment, local);
    			transition_out(hr2.$$.fragment, local);
    			transition_out(img53.$$.fragment, local);
    			transition_out(img54.$$.fragment, local);
    			transition_out(img55.$$.fragment, local);
    			transition_out(img56.$$.fragment, local);
    			transition_out(img57.$$.fragment, local);
    			transition_out(img58.$$.fragment, local);
    			transition_out(img59.$$.fragment, local);
    			transition_out(img60.$$.fragment, local);
    			transition_out(img61.$$.fragment, local);
    			transition_out(img62.$$.fragment, local);
    			transition_out(img63.$$.fragment, local);
    			transition_out(img64.$$.fragment, local);
    			transition_out(img65.$$.fragment, local);
    			transition_out(img66.$$.fragment, local);
    			transition_out(img67.$$.fragment, local);
    			transition_out(img68.$$.fragment, local);
    			transition_out(img69.$$.fragment, local);
    			transition_out(img70.$$.fragment, local);
    			transition_out(img71.$$.fragment, local);
    			transition_out(img72.$$.fragment, local);
    			transition_out(img73.$$.fragment, local);
    			transition_out(vimeo.$$.fragment, local);
    			transition_out(img74.$$.fragment, local);
    			transition_out(hr3.$$.fragment, local);
    			transition_out(dot0.$$.fragment, local);
    			transition_out(dot1.$$.fragment, local);
    			transition_out(dot2.$$.fragment, local);
    			transition_out(dot3.$$.fragment, local);
    			transition_out(dot4.$$.fragment, local);
    			transition_out(dot5.$$.fragment, local);
    			transition_out(dot6.$$.fragment, local);
    			transition_out(dot7.$$.fragment, local);
    			transition_out(dot8.$$.fragment, local);
    			transition_out(dot9.$$.fragment, local);
    			transition_out(dot10.$$.fragment, local);
    			transition_out(dot11.$$.fragment, local);
    			transition_out(dot12.$$.fragment, local);
    			transition_out(dot13.$$.fragment, local);
    			transition_out(dot14.$$.fragment, local);
    			transition_out(dot15.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(div31);
    			destroy_component(img0);
    			destroy_component(img1);
    			destroy_component(img2);
    			destroy_component(img3);
    			destroy_component(img4);
    			destroy_component(img5);
    			destroy_component(img6);
    			destroy_component(img7);
    			destroy_component(img8);
    			destroy_component(img9);
    			destroy_component(img10);
    			destroy_component(img11);
    			destroy_component(img12);
    			destroy_component(img13);
    			if (detaching) detach_dev(div42);
    			destroy_component(img14);
    			destroy_component(img15);
    			destroy_component(img16);
    			if (detaching) detach_dev(div62);
    			destroy_component(img17);
    			destroy_component(img18);
    			destroy_component(img19);
    			destroy_component(img20);
    			destroy_component(img21);
    			destroy_component(img22);
    			destroy_component(mov0);
    			destroy_component(mov1);
    			destroy_component(img23);
    			destroy_component(img24);
    			destroy_component(img25);
    			destroy_component(img26);
    			destroy_component(img27);
    			if (detaching) detach_dev(div73);
    			destroy_component(img28);
    			destroy_component(img29);
    			destroy_component(img30);
    			destroy_component(img31);
    			destroy_component(img32);
    			destroy_component(img33);
    			destroy_component(img34);
    			if (detaching) detach_dev(div85);
    			destroy_component(img35);
    			destroy_component(img36);
    			destroy_component(img37);
    			destroy_component(img38);
    			destroy_component(img39);
    			destroy_component(img40);
    			destroy_component(img41);
    			destroy_component(hr0);
    			if (detaching) detach_dev(div93);
    			destroy_component(img42);
    			destroy_component(img43);
    			destroy_component(img44);
    			destroy_component(img45);
    			destroy_component(img46);
    			destroy_component(img47);
    			destroy_component(hr1);
    			if (detaching) detach_dev(div105);
    			destroy_component(img48);
    			destroy_component(img49);
    			destroy_component(img50);
    			destroy_component(img51);
    			destroy_component(youtube);
    			destroy_component(img52);
    			destroy_component(hr2);
    			if (detaching) detach_dev(div110);
    			destroy_component(img53);
    			destroy_component(img54);
    			destroy_component(img55);
    			destroy_component(img56);
    			destroy_component(img57);
    			if (detaching) detach_dev(div121);
    			destroy_component(img58);
    			destroy_component(img59);
    			destroy_component(img60);
    			destroy_component(img61);
    			destroy_component(img62);
    			destroy_component(img63);
    			if (detaching) detach_dev(div133);
    			destroy_component(img64);
    			destroy_component(img65);
    			destroy_component(img66);
    			destroy_component(img67);
    			destroy_component(img68);
    			destroy_component(img69);
    			if (detaching) detach_dev(div145);
    			destroy_component(img70);
    			destroy_component(img71);
    			destroy_component(img72);
    			destroy_component(img73);
    			if (detaching) detach_dev(div147);
    			destroy_component(vimeo);
    			if (detaching) detach_dev(div152);
    			destroy_component(img74);
    			destroy_component(hr3);
    			if (detaching) detach_dev(div171);
    			destroy_component(dot0);
    			destroy_component(dot1);
    			destroy_component(dot2);
    			destroy_component(dot3);
    			destroy_component(dot4);
    			destroy_component(dot5);
    			destroy_component(dot6);
    			destroy_component(dot7);
    			destroy_component(dot8);
    			destroy_component(dot9);
    			destroy_component(dot10);
    			destroy_component(dot11);
    			destroy_component(dot12);
    			destroy_component(dot13);
    			destroy_component(dot14);
    			destroy_component(dot15);
    			if (detaching) detach_dev(div172);
    			if (detaching) detach_dev(div173);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Part> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Part", $$slots, []);
    	$$self.$capture_state = () => ({ Img, Mov, Youtube, Hr, Vimeo, Dot });
    	return [];
    }

    class Part extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Part",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* portfolio/Main.svelte generated by Svelte v3.22.2 */
    const file$7 = "portfolio/Main.svelte";

    function create_fragment$7(ctx) {
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
    			add_location(stage, file$7, 10, 0, 110);
    			add_location(footer, file$7, 13, 0, 138);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const app = new Main({
      target: document.body,
      props: {},
    });

    return app;

}());
