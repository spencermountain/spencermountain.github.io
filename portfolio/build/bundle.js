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
    	let div19;
    	let div18;
    	let h20;
    	let div5;
    	let div3;
    	let div2;
    	let div4;
    	let div6;
    	let div9;
    	let div8;
    	let iframe;
    	let iframe_src_value;
    	let div7;
    	let div10;
    	let div11;
    	let div13;
    	let div12;
    	let div16;
    	let div14;
    	let div15;
    	let div17;
    	let div30;
    	let div29;
    	let h21;
    	let div22;
    	let div20;
    	let div21;
    	let ul0;
    	let t7;
    	let div23;
    	let t8;
    	let a1;
    	let t10;
    	let div24;
    	let div28;
    	let div27;
    	let div26;
    	let t11;
    	let div25;
    	let t12;
    	let a2;
    	let div42;
    	let div41;
    	let h22;
    	let div34;
    	let div31;
    	let div33;
    	let ul1;
    	let t15;
    	let div32;
    	let t16;
    	let a3;
    	let div39;
    	let div35;
    	let div38;
    	let div36;
    	let div37;
    	let div40;
    	let div50;
    	let div49;
    	let h23;
    	let div47;
    	let div45;
    	let div43;
    	let div44;
    	let div46;
    	let div48;
    	let t21;
    	let a4;
    	let div62;
    	let div61;
    	let h24;
    	let div54;
    	let div52;
    	let div51;
    	let div53;
    	let div55;
    	let div56;
    	let div60;
    	let div57;
    	let div59;
    	let div58;
    	let div67;
    	let div66;
    	let h25;
    	let div63;
    	let t25;
    	let a5;
    	let div64;
    	let div65;
    	let div78;
    	let div77;
    	let h26;
    	let div68;
    	let div72;
    	let div69;
    	let div71;
    	let div70;
    	let ul2;
    	let t29;
    	let a6;
    	let div76;
    	let div73;
    	let div75;
    	let div74;
    	let div90;
    	let div89;
    	let h27;
    	let div81;
    	let div79;
    	let div80;
    	let div83;
    	let t32;
    	let div82;
    	let div84;
    	let t34;
    	let i0;
    	let div85;
    	let div88;
    	let div86;
    	let div87;
    	let div100;
    	let div99;
    	let h28;
    	let div95;
    	let div91;
    	let div94;
    	let div92;
    	let div93;
    	let t40;
    	let a7;
    	let div97;
    	let div96;
    	let div98;
    	let div102;
    	let div101;
    	let h29;
    	let div107;
    	let div106;
    	let h210;
    	let div103;
    	let ul3;
    	let t46;
    	let i1;
    	let div104;
    	let b;
    	let t49;
    	let div105;
    	let div126;
    	let div109;
    	let div108;
    	let img54;
    	let img54_src_value;
    	let ul20;
    	let div110;
    	let a8;
    	let ul4;
    	let div111;
    	let a9;
    	let ul5;
    	let div112;
    	let a10;
    	let ul6;
    	let div113;
    	let a11;
    	let ul7;
    	let div114;
    	let a12;
    	let ul8;
    	let div115;
    	let a13;
    	let ul9;
    	let div116;
    	let a14;
    	let ul10;
    	let div117;
    	let a15;
    	let ul11;
    	let div118;
    	let a16;
    	let ul12;
    	let div119;
    	let a17;
    	let ul13;
    	let div120;
    	let a18;
    	let ul14;
    	let div121;
    	let a19;
    	let ul15;
    	let div122;
    	let a20;
    	let ul16;
    	let div123;
    	let a21;
    	let ul17;
    	let div124;
    	let a22;
    	let ul18;
    	let div125;
    	let a23;
    	let ul19;
    	let div127;
    	let div128;
    	let current;

    	const img0 = new Img({
    			props: {
    				src: "./assets/2020/covid.png",
    				width: "150px",
    				href: "https://www.reddit.com/r/dataisbeautiful/comments/fkwova/oc_rna_sequence_of_covid19_this_8kb_of_data_is/"
    			},
    			$$inline: true
    		});

    	const img1 = new Img({
    			props: {
    				src: "./assets/2020/skydome.png",
    				width: "200px",
    				href: "http://thensome.how/2020/covid-as-skydome/"
    			},
    			$$inline: true
    		});

    	const img2 = new Img({
    			props: {
    				src: "./assets/2020/2020.jpg",
    				width: "250px",
    				caption: ""
    			},
    			$$inline: true
    		});

    	const img3 = new Img({
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
    				width: "250px",
    				href: "http://thensome.how/2018/sports-by-city/"
    			},
    			$$inline: true
    		});

    	const img7 = new Img({
    			props: {
    				src: "./assets/2020/calendar.png",
    				width: "200px",
    				href: "http://blog.spencermounta.in/2019/millenial-calendar/index.html"
    			},
    			$$inline: true
    		});

    	const img8 = new Img({
    			props: {
    				src: "./assets/2020/gun-and-rose.png",
    				width: "350px",
    				href: "https://observablehq.com/@spencermountain/nouns"
    			},
    			$$inline: true
    		});

    	const img9 = new Img({
    			props: {
    				src: "./assets/2019/v12.png",
    				width: "380px",
    				href: "https://observablehq.com/@spencermountain/compromise-values"
    			},
    			$$inline: true
    		});

    	const img10 = new Img({
    			props: {
    				src: "./assets/2019/2019.jpg",
    				width: "150px"
    			},
    			$$inline: true
    		});

    	const img11 = new Img({
    			props: {
    				src: "./assets/2019/dumps.png",
    				width: "150px",
    				href: "http://thensome.how/2019/ontario-landfills/"
    			},
    			$$inline: true
    		});

    	const img12 = new Img({
    			props: {
    				src: "./assets/2019/globe.png",
    				width: "150px",
    				href: "http://blog.spencermounta.in/2019/understanding-the-planet/index.html"
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
    				caption: "did my genealogy. it was hard.",
    				href: "http://blog.spencermounta.in/2019/my-family-tree/index.html"
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
    				width: "350px",
    				href: "https://observablehq.com/@spencermountain/compromise-dates"
    			},
    			$$inline: true
    		});

    	const img20 = new Img({
    			props: {
    				src: "./assets/2018/spacetime.png",
    				width: "250px",
    				href: "https://github.com/spencermountain/spacetime"
    			},
    			$$inline: true
    		});

    	const img21 = new Img({
    			props: {
    				src: "./assets/2018/spacetime.gif",
    				width: "250px",
    				href: "https://github.com/spencermountain/spacetime"
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
    				caption: "compromise v12",
    				href: "https://github.com/spencermountain/compromise/wiki/v12-Release-Notes"
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
    				href: "https://github.com/spencermountain/dumpster-dive/",
    				caption: "system for parsing wikipedia<br/>in-use at Wolfram Alpha"
    			},
    			$$inline: true
    		});

    	const img27 = new Img({
    			props: {
    				src: "./assets/2017/wtf-wikipedia.png",
    				width: "225px",
    				caption: "some of wikipedia's 600-thousand templates",
    				href: "https://github.com/spencermountain/wtf_wikipedia/"
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
    				width: "450px"
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
    				href: "https://state.com/"
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
    				href: "https://www.youtube.com/watch?v=PAymdN2T5oI"
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
    				width: "300px"
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
    			props: { video: "13992710" },
    			$$inline: true
    		});

    	const img53 = new Img({
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
    			div19 = element("div");
    			div18 = element("div");
    			h20 = element("h2");
    			h20.textContent = "2020";
    			div5 = element("div");
    			div3 = element("div");
    			create_component(img0.$$.fragment);
    			div2 = element("div");
    			div2.textContent = "Covid-19";
    			div4 = element("div");
    			create_component(img1.$$.fragment);
    			create_component(img2.$$.fragment);
    			div6 = element("div");
    			create_component(img3.$$.fragment);
    			div9 = element("div");
    			div8 = element("div");
    			iframe = element("iframe");
    			div7 = element("div");
    			div7.textContent = "Computer programming with Spencer Kelly";
    			div10 = element("div");
    			create_component(mov0.$$.fragment);
    			div11 = element("div");
    			create_component(mov1.$$.fragment);
    			div13 = element("div");
    			div12 = element("div");
    			div12.textContent = "learning svelte + blender:";
    			div16 = element("div");
    			div14 = element("div");
    			create_component(img4.$$.fragment);
    			create_component(img5.$$.fragment);
    			div15 = element("div");
    			create_component(img6.$$.fragment);
    			create_component(img7.$$.fragment);
    			div17 = element("div");
    			create_component(img8.$$.fragment);
    			div30 = element("div");
    			div29 = element("div");
    			h21 = element("h2");
    			h21.textContent = "2019";
    			div22 = element("div");
    			div20 = element("div");
    			create_component(img9.$$.fragment);
    			div21 = element("div");
    			create_component(img10.$$.fragment);
    			create_component(img11.$$.fragment);
    			create_component(img12.$$.fragment);
    			ul0 = element("ul");
    			t7 = text("compromise running in the NHS");
    			div23 = element("div");
    			t8 = text("for ");
    			a1 = element("a");
    			a1.textContent = "MBI health";
    			t10 = text(".");
    			div24 = element("div");
    			create_component(img13.$$.fragment);
    			create_component(img14.$$.fragment);
    			div28 = element("div");
    			div27 = element("div");
    			div26 = element("div");
    			t11 = text("a realtime layout solver");
    			div25 = element("div");
    			t12 = text("for ");
    			a2 = element("a");
    			a2.textContent = "venngage.com";
    			create_component(img15.$$.fragment);
    			div42 = element("div");
    			div41 = element("div");
    			h22 = element("h2");
    			h22.textContent = "2018";
    			div34 = element("div");
    			div31 = element("div");
    			create_component(img16.$$.fragment);
    			create_component(img17.$$.fragment);
    			div33 = element("div");
    			create_component(img18.$$.fragment);
    			create_component(img19.$$.fragment);
    			ul1 = element("ul");
    			t15 = text("a date-parser for natural language");
    			div32 = element("div");
    			t16 = text("for ");
    			a3 = element("a");
    			a3.textContent = "begin.com";
    			div39 = element("div");
    			div35 = element("div");
    			create_component(img20.$$.fragment);
    			create_component(img21.$$.fragment);
    			div38 = element("div");
    			div36 = element("div");
    			div36.textContent = "a timezone library";
    			div37 = element("div");
    			div37.textContent = "also hard.";
    			div40 = element("div");
    			create_component(img22.$$.fragment);
    			create_component(hr0.$$.fragment);
    			div50 = element("div");
    			div49 = element("div");
    			h23 = element("h2");
    			h23.textContent = "2017";
    			create_component(img23.$$.fragment);
    			div47 = element("div");
    			div45 = element("div");
    			create_component(img24.$$.fragment);
    			div43 = element("div");
    			create_component(img25.$$.fragment);
    			div44 = element("div");
    			create_component(img26.$$.fragment);
    			div46 = element("div");
    			create_component(img27.$$.fragment);
    			create_component(img28.$$.fragment);
    			div48 = element("div");
    			t21 = text("compromise in use ");
    			a4 = element("a");
    			a4.textContent = "at the United Nations";
    			create_component(hr1.$$.fragment);
    			div62 = element("div");
    			div61 = element("div");
    			h24 = element("h2");
    			h24.textContent = "2016";
    			div54 = element("div");
    			div52 = element("div");
    			create_component(img29.$$.fragment);
    			div51 = element("div");
    			create_component(img30.$$.fragment);
    			div53 = element("div");
    			create_component(img31.$$.fragment);
    			div55 = element("div");
    			create_component(img32.$$.fragment);
    			div56 = element("div");
    			create_component(youtube.$$.fragment);
    			div60 = element("div");
    			div57 = element("div");
    			div59 = element("div");
    			div58 = element("div");
    			create_component(img33.$$.fragment);
    			create_component(hr2.$$.fragment);
    			div67 = element("div");
    			div66 = element("div");
    			h25 = element("h2");
    			h25.textContent = "2015";
    			create_component(img34.$$.fragment);
    			create_component(img35.$$.fragment);
    			div63 = element("div");
    			t25 = text("pension vizualizations for ");
    			a5 = element("a");
    			a5.textContent = "govInvest";
    			create_component(img36.$$.fragment);
    			div64 = element("div");
    			create_component(img37.$$.fragment);
    			div65 = element("div");
    			create_component(img38.$$.fragment);
    			div78 = element("div");
    			div77 = element("div");
    			h26 = element("h2");
    			h26.textContent = "2014";
    			div68 = element("div");
    			div68.textContent = "went to grad school for a short time.";
    			div72 = element("div");
    			div69 = element("div");
    			create_component(img39.$$.fragment);
    			div71 = element("div");
    			div70 = element("div");
    			create_component(img40.$$.fragment);
    			ul2 = element("ul");
    			t29 = text("granted this weird software patent");
    			a6 = element("a");
    			create_component(img41.$$.fragment);
    			div76 = element("div");
    			div73 = element("div");
    			create_component(img42.$$.fragment);
    			div75 = element("div");
    			create_component(img43.$$.fragment);
    			div74 = element("div");
    			div74.textContent = "CUSEC14 hackathon finalist";
    			div90 = element("div");
    			div89 = element("div");
    			h27 = element("h2");
    			h27.textContent = "2013";
    			div81 = element("div");
    			div79 = element("div");
    			create_component(img44.$$.fragment);
    			div80 = element("div");
    			create_component(img45.$$.fragment);
    			create_component(img46.$$.fragment);
    			div83 = element("div");
    			t32 = text("state.com hires 45 people");
    			div82 = element("div");
    			div82.textContent = "all will be laid-off the next year.";
    			create_component(img47.$$.fragment);
    			div84 = element("div");
    			t34 = text("webby nomination - ");
    			i0 = element("i");
    			i0.textContent = "best community, 2013";
    			div85 = element("div");
    			create_component(img48.$$.fragment);
    			create_component(img49.$$.fragment);
    			div88 = element("div");
    			div86 = element("div");
    			div86.textContent = "Freebase shuts-down.";
    			div87 = element("div");
    			div87.textContent = "React and D3 are both created.";
    			div100 = element("div");
    			div99 = element("div");
    			h28 = element("h2");
    			h28.textContent = "2012";
    			div95 = element("div");
    			div91 = element("div");
    			create_component(img50.$$.fragment);
    			div94 = element("div");
    			div92 = element("div");
    			div92.textContent = "moved to Britain";
    			div93 = element("div");
    			t40 = text("for ");
    			a7 = element("a");
    			a7.textContent = "State.com";
    			div97 = element("div");
    			div96 = element("div");
    			div96.textContent = "'london in the rain is beautiful'";
    			create_component(img51.$$.fragment);
    			div98 = element("div");
    			create_component(img52.$$.fragment);
    			div102 = element("div");
    			div101 = element("div");
    			h29 = element("h2");
    			h29.textContent = "2011";
    			create_component(vimeo.$$.fragment);
    			div107 = element("div");
    			div106 = element("div");
    			h210 = element("h2");
    			h210.textContent = "2010";
    			div103 = element("div");
    			div103.textContent = "English Text simplification";
    			create_component(img53.$$.fragment);
    			ul3 = element("ul");
    			t46 = text("frequently cited as ");
    			i1 = element("i");
    			i1.textContent = "'the most naive' simplification of english";
    			div104 = element("div");
    			b = element("b");
    			b.textContent = "wikipedia bot";
    			t49 = text(" accepted on en.wikipedia");
    			div105 = element("div");
    			div105.textContent = "filled-in citation data until 2012.";
    			create_component(hr3.$$.fragment);
    			div126 = element("div");
    			div109 = element("div");
    			div108 = element("div");
    			div108.textContent = "citations:";
    			img54 = element("img");
    			ul20 = element("ul");
    			div110 = element("div");
    			create_component(dot0.$$.fragment);
    			a8 = element("a");
    			a8.textContent = "TensorFlow.js: Machine Learning for the Web and Beyond";
    			ul4 = element("ul");
    			ul4.textContent = "Google. 2019.";
    			div111 = element("div");
    			create_component(dot1.$$.fragment);
    			a9 = element("a");
    			a9.textContent = "Development of a web application for an automated user assistant";
    			ul5 = element("ul");
    			ul5.textContent = "the International Helenic University. 2018.";
    			div112 = element("div");
    			create_component(dot2.$$.fragment);
    			a10 = element("a");
    			a10.textContent = "Pronunciation Scaffolder: Annotation accuracy";
    			ul6 = element("ul");
    			ul6.textContent = "University of Aizu, Japan. 2018.";
    			div113 = element("div");
    			create_component(dot3.$$.fragment);
    			a11 = element("a");
    			a11.textContent = "Authentication Using Dynamic Question Generation";
    			ul7 = element("ul");
    			ul7.textContent = "Somaiya College OF Engineering, Mumbai. 2018.";
    			div114 = element("div");
    			create_component(dot4.$$.fragment);
    			a12 = element("a");
    			a12.textContent = "NETANOS - Named entity-based Text Anonymization for Open Science";
    			ul8 = element("ul");
    			ul8.textContent = "University of Amsterdam. 2017.";
    			div115 = element("div");
    			create_component(dot5.$$.fragment);
    			a13 = element("a");
    			a13.textContent = "Visualization of Thesaurus-Based Web Search";
    			ul9 = element("ul");
    			ul9.textContent = "Vienna University of Technology. 2017.";
    			div116 = element("div");
    			create_component(dot6.$$.fragment);
    			a14 = element("a");
    			a14.textContent = "Web Apps Come of Age for Molecular Sciences";
    			ul10 = element("ul");
    			ul10.textContent = "Swiss Federal Institute of Technology. 2017.";
    			div117 = element("div");
    			create_component(dot7.$$.fragment);
    			a15 = element("a");
    			a15.textContent = "Martello.io whitepaper";
    			ul11 = element("ul");
    			ul11.textContent = "National College of Ireland. 2017.";
    			div118 = element("div");
    			create_component(dot8.$$.fragment);
    			a16 = element("a");
    			a16.textContent = "Wikipedia graph data retrieval";
    			ul12 = element("ul");
    			ul12.textContent = "University of West Bohemia. 2016";
    			div119 = element("div");
    			create_component(dot9.$$.fragment);
    			a17 = element("a");
    			a17.textContent = "New Data-Driven Approaches to Text Simplification";
    			ul13 = element("ul");
    			ul13.textContent = "University of Wolverhampton. 2015.";
    			div120 = element("div");
    			create_component(dot10.$$.fragment);
    			a18 = element("a");
    			a18.textContent = "Learning to Simplify Children Stories with Limited Data";
    			ul14 = element("ul");
    			ul14.textContent = "Vietnam National University. 2014.";
    			div121 = element("div");
    			create_component(dot11.$$.fragment);
    			a19 = element("a");
    			a19.textContent = "SimpLe: Lexical Simplification using Word Sense Disambiguation";
    			ul15 = element("ul");
    			ul15.textContent = "York University, Toronto. 2013.";
    			div122 = element("div");
    			create_component(dot12.$$.fragment);
    			a20 = element("a");
    			a20.textContent = "WikiSimple: Automatic Simplification of Wikipedia Articles";
    			ul16 = element("ul");
    			ul16.textContent = "University of Edinburgh. 2011.";
    			div123 = element("div");
    			create_component(dot13.$$.fragment);
    			a21 = element("a");
    			a21.textContent = "Learning to Simplify Sentences with Quasi-Synchronous Grammar and Integer Programming";
    			ul17 = element("ul");
    			ul17.textContent = "University of Edinburgh. 2011";
    			div124 = element("div");
    			create_component(dot14.$$.fragment);
    			a22 = element("a");
    			a22.textContent = "The future of Search";
    			ul18 = element("ul");
    			ul18.textContent = "UC Berkeley. 2010.";
    			div125 = element("div");
    			create_component(dot15.$$.fragment);
    			a23 = element("a");
    			a23.textContent = "Unsupervised extraction of lexical simplifications Wikipedia";
    			ul19 = element("ul");
    			ul19.textContent = "Cornell. 2010.";
    			div127 = element("div");
    			div128 = element("div");
    			attr_dev(a0, "class", "cursor");
    			attr_dev(a0, "href", "../");
    			set_style(a0, "border-bottom", "1px solid transparent");
    			add_location(a0, file$6, 8, 68, 467);
    			add_location(div0, file$6, 8, 153, 552);
    			attr_dev(div1, "class", "mono f08 row i svelte-17l854g");
    			set_style(div1, "justify-content", "left");
    			add_location(div1, file$6, 8, 9, 408);
    			add_location(h20, file$6, 8, 233, 632);
    			attr_dev(div2, "class", "f06 tab2 mono grey right orange svelte-17l854g");
    			add_location(div2, file$6, 8, 448, 847);
    			attr_dev(div3, "class", "half");
    			add_location(div3, file$6, 8, 263, 662);
    			attr_dev(div4, "class", "half");
    			add_location(div4, file$6, 8, 513, 912);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$6, 8, 246, 645);
    			attr_dev(div6, "class", "m4");
    			add_location(div6, file$6, 8, 715, 1114);
    			attr_dev(iframe, "title", "Computer Programming with Spencer Kelly");
    			set_style(iframe, "border", "solid 1px #dedede");
    			set_style(iframe, "margin-top", "60px");
    			if (iframe.src !== (iframe_src_value = "https://app.stitcher.com/splayer/f/502426/68480006")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "width", "350");
    			attr_dev(iframe, "height", "100");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "scrolling", "no");
    			add_location(iframe, file$6, 8, 973, 1372);
    			attr_dev(div7, "class", "tab i f09");
    			add_location(div7, file$6, 8, 1203, 1602);
    			add_location(div8, file$6, 8, 968, 1367);
    			attr_dev(div9, "class", "row");
    			add_location(div9, file$6, 8, 951, 1350);
    			attr_dev(div10, "class", "mt4");
    			add_location(div10, file$6, 8, 1283, 1682);
    			attr_dev(div11, "class", "mt4");
    			add_location(div11, file$6, 8, 1578, 1977);
    			attr_dev(div12, "class", "tab i f09");
    			add_location(div12, file$6, 8, 1755, 2154);
    			attr_dev(div13, "class", "mt5");
    			add_location(div13, file$6, 8, 1738, 2137);
    			attr_dev(div14, "class", "half");
    			add_location(div14, file$6, 8, 1833, 2232);
    			attr_dev(div15, "class", "half");
    			add_location(div15, file$6, 8, 1969, 2368);
    			attr_dev(div16, "class", "row");
    			add_location(div16, file$6, 8, 1816, 2215);
    			attr_dev(div17, "class", "mt5");
    			add_location(div17, file$6, 8, 2238, 2637);
    			attr_dev(div18, "class", "year");
    			attr_dev(div18, "id", "2020");
    			add_location(div18, file$6, 8, 205, 604);
    			attr_dev(div19, "class", "main mt3");
    			add_location(div19, file$6, 8, 183, 582);
    			add_location(h21, file$6, 8, 2440, 2839);
    			attr_dev(div20, "class", "half");
    			add_location(div20, file$6, 8, 2470, 2869);
    			attr_dev(div21, "class", "half");
    			add_location(div21, file$6, 8, 2614, 3013);
    			attr_dev(div22, "class", "row");
    			add_location(div22, file$6, 8, 2453, 2852);
    			attr_dev(a1, "href", "http://mbihealthgroup.com/");
    			add_location(a1, file$6, 8, 3007, 3406);
    			attr_dev(div23, "class", "tab f09");
    			add_location(div23, file$6, 8, 2982, 3381);
    			attr_dev(ul0, "class", "i m4");
    			add_location(ul0, file$6, 8, 2936, 3335);
    			attr_dev(div24, "class", "row mt4");
    			add_location(div24, file$6, 8, 3070, 3469);
    			attr_dev(a2, "href", "https://venngage.com/");
    			add_location(a2, file$6, 8, 3337, 3736);
    			attr_dev(div25, "class", "tab f09");
    			add_location(div25, file$6, 8, 3312, 3711);
    			attr_dev(div26, "class", "i");
    			add_location(div26, file$6, 8, 3273, 3672);
    			add_location(div27, file$6, 8, 3268, 3667);
    			attr_dev(div28, "class", "tab row mt3");
    			set_style(div28, "justify-content", "normal");
    			add_location(div28, file$6, 8, 3210, 3609);
    			attr_dev(div29, "class", "year");
    			attr_dev(div29, "id", "2019");
    			add_location(div29, file$6, 8, 2412, 2811);
    			attr_dev(div30, "class", "main mt4");
    			add_location(div30, file$6, 8, 2390, 2789);
    			add_location(h22, file$6, 8, 3528, 3927);
    			attr_dev(div31, "class", "half");
    			add_location(div31, file$6, 8, 3558, 3957);
    			attr_dev(a3, "href", "https://begin.com");
    			add_location(a3, file$6, 8, 4073, 4472);
    			attr_dev(div32, "class", "i tab f09");
    			add_location(div32, file$6, 8, 4046, 4445);
    			add_location(ul1, file$6, 8, 4008, 4407);
    			attr_dev(div33, "class", "half");
    			add_location(div33, file$6, 8, 3811, 4210);
    			attr_dev(div34, "class", "row");
    			add_location(div34, file$6, 8, 3541, 3940);
    			attr_dev(div35, "class", "half");
    			add_location(div35, file$6, 8, 4158, 4557);
    			add_location(div36, file$6, 8, 4422, 4821);
    			attr_dev(div37, "class", "i");
    			add_location(div37, file$6, 8, 4451, 4850);
    			attr_dev(div38, "class", "half");
    			add_location(div38, file$6, 8, 4404, 4803);
    			attr_dev(div39, "class", "row mt4");
    			add_location(div39, file$6, 8, 4137, 4536);
    			attr_dev(div40, "class", "tab2");
    			add_location(div40, file$6, 8, 4494, 4893);
    			attr_dev(div41, "class", "year");
    			attr_dev(div41, "id", "2018");
    			add_location(div41, file$6, 8, 3500, 3899);
    			attr_dev(div42, "class", "main mt4");
    			add_location(div42, file$6, 8, 3478, 3877);
    			add_location(h23, file$6, 8, 4645, 5044);
    			attr_dev(div43, "class", "mt2");
    			add_location(div43, file$6, 8, 4933, 5332);
    			attr_dev(div44, "class", "mt3");
    			add_location(div44, file$6, 8, 5021, 5420);
    			attr_dev(div45, "class", "half");
    			add_location(div45, file$6, 8, 4843, 5242);
    			attr_dev(div46, "class", "half");
    			add_location(div46, file$6, 8, 5239, 5638);
    			attr_dev(div47, "class", "row mt3");
    			add_location(div47, file$6, 8, 4822, 5221);
    			attr_dev(a4, "href", "https://devblogs.microsoft.com/cse/2017/06/06/geocoding-social-conversations-nlp-javascript/");
    			add_location(a4, file$6, 8, 5547, 5946);
    			attr_dev(div48, "class", "mt5 ml3");
    			add_location(div48, file$6, 8, 5508, 5907);
    			attr_dev(div49, "class", "year");
    			attr_dev(div49, "id", "2017");
    			add_location(div49, file$6, 8, 4617, 5016);
    			attr_dev(div50, "class", "main mt5");
    			add_location(div50, file$6, 8, 4595, 4994);
    			add_location(h24, file$6, 8, 5752, 6151);
    			attr_dev(div51, "class", "mt2");
    			add_location(div51, file$6, 8, 5864, 6263);
    			attr_dev(div52, "class", "half");
    			add_location(div52, file$6, 8, 5782, 6181);
    			attr_dev(div53, "class", "half");
    			add_location(div53, file$6, 8, 5966, 6365);
    			attr_dev(div54, "class", "row");
    			add_location(div54, file$6, 8, 5765, 6164);
    			attr_dev(div55, "class", "mt3");
    			add_location(div55, file$6, 8, 6060, 6459);
    			attr_dev(div56, "class", "mt3");
    			add_location(div56, file$6, 8, 6141, 6540);
    			attr_dev(div57, "class", "half");
    			add_location(div57, file$6, 8, 6227, 6626);
    			attr_dev(div58, "class", "mt3");
    			add_location(div58, file$6, 8, 6269, 6668);
    			attr_dev(div59, "class", "half");
    			add_location(div59, file$6, 8, 6251, 6650);
    			attr_dev(div60, "class", "row nowrap");
    			add_location(div60, file$6, 8, 6203, 6602);
    			attr_dev(div61, "class", "year");
    			attr_dev(div61, "id", "2016");
    			add_location(div61, file$6, 8, 5724, 6123);
    			attr_dev(div62, "class", "main mt5");
    			add_location(div62, file$6, 8, 5702, 6101);
    			add_location(h25, file$6, 8, 6445, 6844);
    			attr_dev(a5, "href", "https://govinvest.com/");
    			add_location(a5, file$6, 8, 6661, 7060);
    			attr_dev(div63, "class", "right mt2 f09");
    			add_location(div63, file$6, 8, 6607, 7006);
    			attr_dev(div64, "class", "tab");
    			add_location(div64, file$6, 8, 6781, 7180);
    			attr_dev(div65, "class", "mt3");
    			add_location(div65, file$6, 8, 6876, 7275);
    			attr_dev(div66, "class", "year");
    			attr_dev(div66, "id", "2015");
    			add_location(div66, file$6, 8, 6417, 6816);
    			attr_dev(div67, "class", "main mt5");
    			add_location(div67, file$6, 8, 6394, 6793);
    			add_location(h26, file$6, 8, 7079, 7478);
    			add_location(div68, file$6, 8, 7092, 7491);
    			attr_dev(div69, "class", "half");
    			add_location(div69, file$6, 8, 7157, 7556);
    			attr_dev(div70, "class", "mt2");
    			add_location(div70, file$6, 8, 7270, 7669);
    			attr_dev(div71, "class", "half");
    			add_location(div71, file$6, 8, 7252, 7651);
    			attr_dev(div72, "class", "row");
    			add_location(div72, file$6, 8, 7140, 7539);
    			attr_dev(a6, "href", "https://patents.google.com/patent/US20150089409A1/en");
    			add_location(a6, file$6, 8, 7435, 7834);
    			attr_dev(ul2, "class", "mt4 i");
    			add_location(ul2, file$6, 8, 7383, 7782);
    			attr_dev(div73, "class", "half");
    			add_location(div73, file$6, 8, 7601, 8000);
    			attr_dev(div74, "class", "f09 i grey");
    			add_location(div74, file$6, 8, 7793, 8192);
    			attr_dev(div75, "class", "half ml1");
    			add_location(div75, file$6, 8, 7698, 8097);
    			attr_dev(div76, "class", "row mt3");
    			add_location(div76, file$6, 8, 7580, 7979);
    			attr_dev(div77, "class", "year");
    			attr_dev(div77, "id", "2014");
    			add_location(div77, file$6, 8, 7051, 7450);
    			attr_dev(div78, "class", "main mt5");
    			add_location(div78, file$6, 8, 7028, 7427);
    			add_location(h27, file$6, 8, 7923, 8322);
    			attr_dev(div79, "class", "half");
    			add_location(div79, file$6, 8, 7953, 8352);
    			attr_dev(div80, "class", "half");
    			add_location(div80, file$6, 8, 8059, 8458);
    			attr_dev(div81, "class", "row");
    			add_location(div81, file$6, 8, 7936, 8335);
    			attr_dev(div82, "class", "i f09 tab");
    			add_location(div82, file$6, 8, 8265, 8664);
    			attr_dev(div83, "class", "tab mt5");
    			add_location(div83, file$6, 8, 8219, 8618);
    			add_location(i0, file$6, 8, 8497, 8896);
    			attr_dev(div84, "class", "hangright mt5");
    			add_location(div84, file$6, 8, 8451, 8850);
    			attr_dev(div85, "class", "m3");
    			add_location(div85, file$6, 8, 8530, 8929);
    			add_location(div86, file$6, 8, 8726, 9125);
    			add_location(div87, file$6, 8, 8757, 9156);
    			attr_dev(div88, "class", "tab i f09 ml4 mt3");
    			add_location(div88, file$6, 8, 8695, 9094);
    			attr_dev(div89, "class", "year");
    			attr_dev(div89, "id", "2013");
    			add_location(div89, file$6, 8, 7895, 8294);
    			attr_dev(div90, "class", "main mt5");
    			add_location(div90, file$6, 8, 7873, 8272);
    			add_location(h28, file$6, 8, 8867, 9266);
    			attr_dev(div91, "class", "half");
    			add_location(div91, file$6, 8, 8897, 9296);
    			add_location(div92, file$6, 8, 9006, 9405);
    			attr_dev(a7, "href", "https://state.com/");
    			add_location(a7, file$6, 8, 9060, 9459);
    			attr_dev(div93, "class", "tab i f09");
    			add_location(div93, file$6, 8, 9033, 9432);
    			attr_dev(div94, "class", "half");
    			add_location(div94, file$6, 8, 8988, 9387);
    			attr_dev(div95, "class", "row");
    			add_location(div95, file$6, 8, 8880, 9279);
    			attr_dev(div96, "class", "i f09");
    			set_style(div96, "text-align", "right");
    			set_style(div96, "margin-right", "3rem");
    			add_location(div96, file$6, 8, 9137, 9536);
    			attr_dev(div97, "class", "mt3");
    			add_location(div97, file$6, 8, 9120, 9519);
    			attr_dev(div98, "class", "mt3");
    			add_location(div98, file$6, 8, 9303, 9702);
    			attr_dev(div99, "class", "year");
    			attr_dev(div99, "id", "2012");
    			add_location(div99, file$6, 8, 8839, 9238);
    			attr_dev(div100, "class", "main mt5");
    			add_location(div100, file$6, 8, 8816, 9215);
    			add_location(h29, file$6, 8, 9492, 9891);
    			attr_dev(div101, "class", "year");
    			attr_dev(div101, "id", "2011");
    			set_style(div101, "width", "100%");
    			set_style(div101, "max-width", "600px");
    			add_location(div101, file$6, 8, 9426, 9825);
    			attr_dev(div102, "class", "main mt5");
    			add_location(div102, file$6, 8, 9403, 9802);
    			add_location(h210, file$6, 8, 9600, 9999);
    			add_location(div103, file$6, 8, 9613, 10012);
    			add_location(i1, file$6, 8, 9839, 10238);
    			add_location(ul3, file$6, 8, 9815, 10214);
    			add_location(b, file$6, 8, 9919, 10318);
    			attr_dev(div104, "class", "mt4 ml2 navy");
    			add_location(div104, file$6, 8, 9893, 10292);
    			attr_dev(div105, "class", "ml4 i");
    			add_location(div105, file$6, 8, 9970, 10369);
    			attr_dev(div106, "class", "year");
    			attr_dev(div106, "id", "2010");
    			add_location(div106, file$6, 8, 9572, 9971);
    			attr_dev(div107, "class", "main mt5");
    			add_location(div107, file$6, 8, 9549, 9948);
    			attr_dev(div108, "class", "f2");
    			add_location(div108, file$6, 8, 10123, 10522);
    			attr_dev(img54, "class", "ml3");
    			if (img54.src !== (img54_src_value = "./assets/2010/piano.gif")) attr_dev(img54, "src", img54_src_value);
    			add_location(img54, file$6, 8, 10155, 10554);
    			attr_dev(div109, "class", "row");
    			set_style(div109, "justify-content", "normal");
    			add_location(div109, file$6, 8, 10073, 10472);
    			attr_dev(a8, "href", "https://arxiv.org/abs/1901.05350");
    			add_location(a8, file$6, 8, 10250, 10649);
    			add_location(ul4, file$6, 8, 10351, 10750);
    			add_location(div110, file$6, 8, 10213, 10612);
    			attr_dev(a9, "href", "https://repository.ihu.edu.gr//xmlui/handle/11544/29186");
    			add_location(a9, file$6, 8, 10416, 10815);
    			add_location(ul5, file$6, 8, 10550, 10949);
    			add_location(div111, file$6, 8, 10379, 10778);
    			attr_dev(a10, "href", "https://www.isca-speech.org/archive/ISAPh_2018/pdfs/18.pdf");
    			add_location(a10, file$6, 8, 10645, 11044);
    			add_location(ul6, file$6, 8, 10763, 11162);
    			add_location(div112, file$6, 8, 10608, 11007);
    			attr_dev(a11, "href", "https://link.springer.com/chapter/10.1007/978-981-10-8797-4_31");
    			add_location(a11, file$6, 8, 10847, 11246);
    			add_location(ul7, file$6, 8, 10972, 11371);
    			add_location(div113, file$6, 8, 10810, 11209);
    			attr_dev(a12, "href", "https://osf.io/w9nhb");
    			add_location(a12, file$6, 8, 11069, 11468);
    			add_location(ul8, file$6, 8, 11168, 11567);
    			add_location(div114, file$6, 8, 11032, 11431);
    			attr_dev(a13, "href", "https://www.cg.tuwien.ac.at/research/publications/2017/mazurek-2017-vows/mazurek-2017-vows-report.pdf");
    			add_location(a13, file$6, 8, 11250, 11649);
    			add_location(ul9, file$6, 8, 11409, 11808);
    			add_location(div115, file$6, 8, 11213, 11612);
    			attr_dev(a14, "href", "https://www.mdpi.com/2227-9709/4/3/28/htm");
    			add_location(a14, file$6, 8, 11499, 11898);
    			add_location(ul10, file$6, 8, 11598, 11997);
    			add_location(div116, file$6, 8, 11462, 11861);
    			attr_dev(a15, "href", "https://core.ac.uk/download/pdf/132597718.pdf");
    			add_location(a15, file$6, 8, 11694, 12093);
    			add_location(ul11, file$6, 8, 11776, 12175);
    			add_location(div117, file$6, 8, 11657, 12056);
    			attr_dev(a16, "href", "https://otik.uk.zcu.cz/handle/11025/23829");
    			add_location(a16, file$6, 8, 11861, 12260);
    			add_location(ul12, file$6, 8, 11947, 12346);
    			add_location(div118, file$6, 8, 11825, 12224);
    			attr_dev(a17, "href", "https://wlv.openrepository.com/bitstream/handle/2436/601113/Stajner_PhD+thesis.pdf?sequence=1");
    			add_location(a17, file$6, 8, 12027, 12426);
    			add_location(ul13, file$6, 8, 12184, 12583);
    			add_location(div119, file$6, 8, 11994, 12393);
    			attr_dev(a18, "href", "http://l3s.de/~gtran/publications/vu_et_al_2014.pdf");
    			add_location(a18, file$6, 8, 12266, 12665);
    			add_location(ul14, file$6, 8, 12387, 12786);
    			add_location(div120, file$6, 8, 12233, 12632);
    			attr_dev(a19, "href", "https://wiki.eecs.yorku.ca/course_archive/2013-14/W/6339/_media/simple_book.pdf");
    			add_location(a19, file$6, 8, 12469, 12868);
    			add_location(ul15, file$6, 8, 12625, 13024);
    			add_location(div121, file$6, 8, 12436, 12835);
    			attr_dev(a20, "href", "https://www.semanticscholar.org/paper/WikiSimple%3A-Automatic-Simplification-of-Wikipedia-Woodsend-Lapata/e4c71fd504fd6657fc444e82e481b22f952bcaab");
    			add_location(a20, file$6, 8, 12704, 13103);
    			add_location(ul16, file$6, 8, 12923, 13322);
    			add_location(div122, file$6, 8, 12671, 13070);
    			attr_dev(a21, "href", "https://dl.acm.org/citation.cfm?id=2145480");
    			add_location(a21, file$6, 8, 13001, 13400);
    			add_location(ul17, file$6, 8, 13143, 13542);
    			add_location(div123, file$6, 8, 12968, 13367);
    			attr_dev(a22, "href", "https://www.slideshare.net/marti_hearst/the-future-of-search-keynote-at-iknow-2010");
    			add_location(a22, file$6, 8, 13222, 13621);
    			add_location(ul18, file$6, 8, 13339, 13738);
    			add_location(div124, file$6, 8, 13187, 13586);
    			attr_dev(a23, "href", "https://dl.acm.org/citation.cfm?id=1858055");
    			add_location(a23, file$6, 8, 13405, 13804);
    			add_location(ul19, file$6, 8, 13522, 13921);
    			add_location(div125, file$6, 8, 13372, 13771);
    			add_location(ul20, file$6, 8, 10209, 10608);
    			attr_dev(div126, "class", "main mt4");
    			add_location(div126, file$6, 8, 10051, 10450);
    			attr_dev(div127, "class", "space");
    			add_location(div127, file$6, 8, 13562, 13961);
    			attr_dev(div128, "class", "space");
    			add_location(div128, file$6, 8, 13587, 13986);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a0);
    			append_dev(div1, div0);
    			insert_dev(target, div19, anchor);
    			append_dev(div19, div18);
    			append_dev(div18, h20);
    			append_dev(div18, div5);
    			append_dev(div5, div3);
    			mount_component(img0, div3, null);
    			append_dev(div3, div2);
    			append_dev(div5, div4);
    			mount_component(img1, div4, null);
    			mount_component(img2, div4, null);
    			append_dev(div18, div6);
    			mount_component(img3, div6, null);
    			append_dev(div18, div9);
    			append_dev(div9, div8);
    			append_dev(div8, iframe);
    			append_dev(div8, div7);
    			append_dev(div18, div10);
    			mount_component(mov0, div10, null);
    			append_dev(div18, div11);
    			mount_component(mov1, div11, null);
    			append_dev(div18, div13);
    			append_dev(div13, div12);
    			append_dev(div18, div16);
    			append_dev(div16, div14);
    			mount_component(img4, div14, null);
    			mount_component(img5, div14, null);
    			append_dev(div16, div15);
    			mount_component(img6, div15, null);
    			mount_component(img7, div15, null);
    			append_dev(div18, div17);
    			mount_component(img8, div17, null);
    			insert_dev(target, div30, anchor);
    			append_dev(div30, div29);
    			append_dev(div29, h21);
    			append_dev(div29, div22);
    			append_dev(div22, div20);
    			mount_component(img9, div20, null);
    			append_dev(div22, div21);
    			mount_component(img10, div21, null);
    			mount_component(img11, div21, null);
    			mount_component(img12, div21, null);
    			append_dev(div29, ul0);
    			append_dev(ul0, t7);
    			append_dev(ul0, div23);
    			append_dev(div23, t8);
    			append_dev(div23, a1);
    			append_dev(div23, t10);
    			append_dev(div29, div24);
    			mount_component(img13, div24, null);
    			mount_component(img14, div24, null);
    			append_dev(div29, div28);
    			append_dev(div28, div27);
    			append_dev(div27, div26);
    			append_dev(div26, t11);
    			append_dev(div26, div25);
    			append_dev(div25, t12);
    			append_dev(div25, a2);
    			mount_component(img15, div28, null);
    			insert_dev(target, div42, anchor);
    			append_dev(div42, div41);
    			append_dev(div41, h22);
    			append_dev(div41, div34);
    			append_dev(div34, div31);
    			mount_component(img16, div31, null);
    			mount_component(img17, div31, null);
    			append_dev(div34, div33);
    			mount_component(img18, div33, null);
    			mount_component(img19, div33, null);
    			append_dev(div33, ul1);
    			append_dev(ul1, t15);
    			append_dev(ul1, div32);
    			append_dev(div32, t16);
    			append_dev(div32, a3);
    			append_dev(div41, div39);
    			append_dev(div39, div35);
    			mount_component(img20, div35, null);
    			mount_component(img21, div35, null);
    			append_dev(div39, div38);
    			append_dev(div38, div36);
    			append_dev(div38, div37);
    			append_dev(div41, div40);
    			mount_component(img22, div40, null);
    			mount_component(hr0, div41, null);
    			insert_dev(target, div50, anchor);
    			append_dev(div50, div49);
    			append_dev(div49, h23);
    			mount_component(img23, div49, null);
    			append_dev(div49, div47);
    			append_dev(div47, div45);
    			mount_component(img24, div45, null);
    			append_dev(div45, div43);
    			mount_component(img25, div43, null);
    			append_dev(div45, div44);
    			mount_component(img26, div44, null);
    			append_dev(div47, div46);
    			mount_component(img27, div46, null);
    			mount_component(img28, div46, null);
    			append_dev(div49, div48);
    			append_dev(div48, t21);
    			append_dev(div48, a4);
    			mount_component(hr1, div49, null);
    			insert_dev(target, div62, anchor);
    			append_dev(div62, div61);
    			append_dev(div61, h24);
    			append_dev(div61, div54);
    			append_dev(div54, div52);
    			mount_component(img29, div52, null);
    			append_dev(div52, div51);
    			mount_component(img30, div51, null);
    			append_dev(div54, div53);
    			mount_component(img31, div53, null);
    			append_dev(div61, div55);
    			mount_component(img32, div55, null);
    			append_dev(div61, div56);
    			mount_component(youtube, div56, null);
    			append_dev(div61, div60);
    			append_dev(div60, div57);
    			append_dev(div60, div59);
    			append_dev(div59, div58);
    			mount_component(img33, div58, null);
    			mount_component(hr2, div61, null);
    			insert_dev(target, div67, anchor);
    			append_dev(div67, div66);
    			append_dev(div66, h25);
    			mount_component(img34, div66, null);
    			mount_component(img35, div66, null);
    			append_dev(div66, div63);
    			append_dev(div63, t25);
    			append_dev(div63, a5);
    			mount_component(img36, div66, null);
    			append_dev(div66, div64);
    			mount_component(img37, div64, null);
    			append_dev(div66, div65);
    			mount_component(img38, div65, null);
    			insert_dev(target, div78, anchor);
    			append_dev(div78, div77);
    			append_dev(div77, h26);
    			append_dev(div77, div68);
    			append_dev(div77, div72);
    			append_dev(div72, div69);
    			mount_component(img39, div69, null);
    			append_dev(div72, div71);
    			append_dev(div71, div70);
    			mount_component(img40, div70, null);
    			append_dev(div77, ul2);
    			append_dev(ul2, t29);
    			append_dev(ul2, a6);
    			mount_component(img41, a6, null);
    			append_dev(div77, div76);
    			append_dev(div76, div73);
    			mount_component(img42, div73, null);
    			append_dev(div76, div75);
    			mount_component(img43, div75, null);
    			append_dev(div75, div74);
    			insert_dev(target, div90, anchor);
    			append_dev(div90, div89);
    			append_dev(div89, h27);
    			append_dev(div89, div81);
    			append_dev(div81, div79);
    			mount_component(img44, div79, null);
    			append_dev(div81, div80);
    			mount_component(img45, div80, null);
    			mount_component(img46, div80, null);
    			append_dev(div89, div83);
    			append_dev(div83, t32);
    			append_dev(div83, div82);
    			mount_component(img47, div83, null);
    			append_dev(div89, div84);
    			append_dev(div84, t34);
    			append_dev(div84, i0);
    			append_dev(div89, div85);
    			mount_component(img48, div85, null);
    			mount_component(img49, div89, null);
    			append_dev(div89, div88);
    			append_dev(div88, div86);
    			append_dev(div88, div87);
    			insert_dev(target, div100, anchor);
    			append_dev(div100, div99);
    			append_dev(div99, h28);
    			append_dev(div99, div95);
    			append_dev(div95, div91);
    			mount_component(img50, div91, null);
    			append_dev(div95, div94);
    			append_dev(div94, div92);
    			append_dev(div94, div93);
    			append_dev(div93, t40);
    			append_dev(div93, a7);
    			append_dev(div99, div97);
    			append_dev(div97, div96);
    			mount_component(img51, div97, null);
    			append_dev(div99, div98);
    			mount_component(img52, div98, null);
    			insert_dev(target, div102, anchor);
    			append_dev(div102, div101);
    			append_dev(div101, h29);
    			mount_component(vimeo, div101, null);
    			insert_dev(target, div107, anchor);
    			append_dev(div107, div106);
    			append_dev(div106, h210);
    			append_dev(div106, div103);
    			mount_component(img53, div106, null);
    			append_dev(div106, ul3);
    			append_dev(ul3, t46);
    			append_dev(ul3, i1);
    			append_dev(div106, div104);
    			append_dev(div104, b);
    			append_dev(div104, t49);
    			append_dev(div106, div105);
    			mount_component(hr3, div107, null);
    			insert_dev(target, div126, anchor);
    			append_dev(div126, div109);
    			append_dev(div109, div108);
    			append_dev(div109, img54);
    			append_dev(div126, ul20);
    			append_dev(ul20, div110);
    			mount_component(dot0, div110, null);
    			append_dev(div110, a8);
    			append_dev(div110, ul4);
    			append_dev(ul20, div111);
    			mount_component(dot1, div111, null);
    			append_dev(div111, a9);
    			append_dev(div111, ul5);
    			append_dev(ul20, div112);
    			mount_component(dot2, div112, null);
    			append_dev(div112, a10);
    			append_dev(div112, ul6);
    			append_dev(ul20, div113);
    			mount_component(dot3, div113, null);
    			append_dev(div113, a11);
    			append_dev(div113, ul7);
    			append_dev(ul20, div114);
    			mount_component(dot4, div114, null);
    			append_dev(div114, a12);
    			append_dev(div114, ul8);
    			append_dev(ul20, div115);
    			mount_component(dot5, div115, null);
    			append_dev(div115, a13);
    			append_dev(div115, ul9);
    			append_dev(ul20, div116);
    			mount_component(dot6, div116, null);
    			append_dev(div116, a14);
    			append_dev(div116, ul10);
    			append_dev(ul20, div117);
    			mount_component(dot7, div117, null);
    			append_dev(div117, a15);
    			append_dev(div117, ul11);
    			append_dev(ul20, div118);
    			mount_component(dot8, div118, null);
    			append_dev(div118, a16);
    			append_dev(div118, ul12);
    			append_dev(ul20, div119);
    			mount_component(dot9, div119, null);
    			append_dev(div119, a17);
    			append_dev(div119, ul13);
    			append_dev(ul20, div120);
    			mount_component(dot10, div120, null);
    			append_dev(div120, a18);
    			append_dev(div120, ul14);
    			append_dev(ul20, div121);
    			mount_component(dot11, div121, null);
    			append_dev(div121, a19);
    			append_dev(div121, ul15);
    			append_dev(ul20, div122);
    			mount_component(dot12, div122, null);
    			append_dev(div122, a20);
    			append_dev(div122, ul16);
    			append_dev(ul20, div123);
    			mount_component(dot13, div123, null);
    			append_dev(div123, a21);
    			append_dev(div123, ul17);
    			append_dev(ul20, div124);
    			mount_component(dot14, div124, null);
    			append_dev(div124, a22);
    			append_dev(div124, ul18);
    			append_dev(ul20, div125);
    			mount_component(dot15, div125, null);
    			append_dev(div125, a23);
    			append_dev(div125, ul19);
    			insert_dev(target, div127, anchor);
    			insert_dev(target, div128, anchor);
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
    			transition_in(img1.$$.fragment, local);
    			transition_in(img2.$$.fragment, local);
    			transition_in(img3.$$.fragment, local);
    			transition_in(mov0.$$.fragment, local);
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
    			transition_out(mov0.$$.fragment, local);
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
    			if (detaching) detach_dev(div19);
    			destroy_component(img0);
    			destroy_component(img1);
    			destroy_component(img2);
    			destroy_component(img3);
    			destroy_component(mov0);
    			destroy_component(mov1);
    			destroy_component(img4);
    			destroy_component(img5);
    			destroy_component(img6);
    			destroy_component(img7);
    			destroy_component(img8);
    			if (detaching) detach_dev(div30);
    			destroy_component(img9);
    			destroy_component(img10);
    			destroy_component(img11);
    			destroy_component(img12);
    			destroy_component(img13);
    			destroy_component(img14);
    			destroy_component(img15);
    			if (detaching) detach_dev(div42);
    			destroy_component(img16);
    			destroy_component(img17);
    			destroy_component(img18);
    			destroy_component(img19);
    			destroy_component(img20);
    			destroy_component(img21);
    			destroy_component(img22);
    			destroy_component(hr0);
    			if (detaching) detach_dev(div50);
    			destroy_component(img23);
    			destroy_component(img24);
    			destroy_component(img25);
    			destroy_component(img26);
    			destroy_component(img27);
    			destroy_component(img28);
    			destroy_component(hr1);
    			if (detaching) detach_dev(div62);
    			destroy_component(img29);
    			destroy_component(img30);
    			destroy_component(img31);
    			destroy_component(img32);
    			destroy_component(youtube);
    			destroy_component(img33);
    			destroy_component(hr2);
    			if (detaching) detach_dev(div67);
    			destroy_component(img34);
    			destroy_component(img35);
    			destroy_component(img36);
    			destroy_component(img37);
    			destroy_component(img38);
    			if (detaching) detach_dev(div78);
    			destroy_component(img39);
    			destroy_component(img40);
    			destroy_component(img41);
    			destroy_component(img42);
    			destroy_component(img43);
    			if (detaching) detach_dev(div90);
    			destroy_component(img44);
    			destroy_component(img45);
    			destroy_component(img46);
    			destroy_component(img47);
    			destroy_component(img48);
    			destroy_component(img49);
    			if (detaching) detach_dev(div100);
    			destroy_component(img50);
    			destroy_component(img51);
    			destroy_component(img52);
    			if (detaching) detach_dev(div102);
    			destroy_component(vimeo);
    			if (detaching) detach_dev(div107);
    			destroy_component(img53);
    			destroy_component(hr3);
    			if (detaching) detach_dev(div126);
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
    			if (detaching) detach_dev(div127);
    			if (detaching) detach_dev(div128);
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
