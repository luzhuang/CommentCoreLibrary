/** Define some Unpackers **/
(function(){
	/** This is the DOM Manipulation Library **/
	var _ = function (type, props, children, callback) {
		var elem = null;
		if (type === "text") {
			return document.createTextNode(props);
		} else if(type === "svg"){
			elem = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		}else {
			elem = document.createElement(type);
		}
		for(var n in props){
			if(n !== "style" && n !== "className"){
				elem.setAttribute(n, props[n]);
			}else if(n === "className"){
				elem.className = props[n];
			}else{
				for(var x in props.style){
					elem.style[x] = props.style[x];
				}
			}
		}
		if (children) {
			for(var i = 0; i < children.length; i++){
				if(children[i] != null)
					elem.appendChild(children[i]);
			}
		}
		if (callback && typeof callback === "function") {
			callback(elem);
		}
		return elem;
	};
	var ScriptingContext = CCLScripting.prototype.ScriptingContext;
	ScriptingContext.prototype.Unpack.TextField = function(stage, data, ctx){
		this.DOM = _("div",{
			"style":{
				"position":"absolute",
			},
			"className":"cmt"
		});
		/** Load the text **/
		this.DOM.appendChild(document.createTextNode(data.text));
		var getColor = function(c){
			var color = c.toString(16);
			while(color.length < 6){
				color = "0" + color;
			}
			return "#" + color;
		};
		this.setTextFormat = function(textFormat){
			this.DOM.style.fontFamily = textFormat.font;
			this.DOM.style.fontSize = textFormat.size + "px";
			this.DOM.style.color = getColor(textFormat.color);
			if(textFormat.color <= 16){
				this.DOM.style.textShadow = "0 0 1px #fff";
			};
			if(textFormat.bold)
				this.DOM.style.fontWeight = "bold";
			if(textFormat.underline)
				this.DOM.style.textDecoration = "underline";
			if(textFormat.italic)
				this.DOM.style.fontStyle = "italic";
			this.DOM.style.margin = textFormat.margin;
		};
		/** Load the text format **/
		this.setTextFormat(data.textFormat);

		this.setX = function(x){
			data.x = x;
			this.DOM.style.left = data.x + "px";
		};
		
		this.setY = function(y){
			data.y = y;
			this.DOM.style.top = data.y + "px";
		};
		/** Load x,y **/
		this.setX(data.x);
		this.setY(data.y);
		
		/** Other **/
		this.setText = function(text){
			this.DOM.innerHTML = "";
			this.DOM.appendChild(_("text",text));
		};
		this.__defineSetter__("x", function(f){
			this.setX(f);
		});
		this.__defineSetter__("y", function(f){
			this.setY(f);
		});
		this.__defineGetter__("text", function(f){
			return this.DOM.textContent;
		});
		this.__defineSetter__("text", function(f){
			this.setText(f);
		});
		this.__defineGetter__("filters", function(f){
			return [];
		});
		this.__defineSetter__("filters", function(f){
			this.setFilters([f]);
		});
		this.setFilters = function(params){
			for(var i = 0; i < params[0].length; i++){
				var filter = params[0][i];
				if(filter.type === "blur"){
					this.DOM.style.color = "transparent";
					this.DOM.style.textShadow = [0,0, Math.max(
							filter.params.blurX, filter.params.blurY) + 
						"px"].join(" "); 
				}else if(filter.type === "glow"){
					this.DOM.style.textShadow = [0,0, Math.max(
							filter.params.blurX, filter.params.blurY) + 
						"px", getColor(filter.params.color)].join(" "); 
				}
			};
		};
		
		/** Common **/
		this.unload = function(){
			try{
				stage.removeChild(this.DOM);
			}catch(e){};
		};
		// Hook child
		stage.appendChild(this.DOM);
	};
	
	ScriptingContext.prototype.Unpack.Shape = function(stage, data, ctx){
		this.DOM = _("svg",{
			"width":stage.offsetWidth, 
			"height":stage.offsetHeight,
			"style":{
				"position":"absolute",
				"top":"0px",
				"left":"0px",
				"width":"100%",
				"height":"100%"
		}});
		this._x = data.x ? data.x : 0;
		this._y = data.y ? data.y : 0;
		this._alpha = data.alpha ? data.alpha : 1;
		// Helpers
		var __ = function(e, attr){
			if(typeof e === "string"){
				var elem = 
					document.createElementNS("http://www.w3.org/2000/svg",e);
			}else{
				var elem = e;
			}
			if(attr){
				for(var x in attr){
					elem.setAttribute(x, attr[x]);
				}
			}
			return elem;
		};
		var defaultEffects = __("defs");
		var defaultGroup = __("g",{
			"transform":"translate(" + this._x + "," + this._y + ")",
			"opacity":this._alpha,
		});
		var defaultGroupWithEffects = defaultGroup;
		this.DOM.appendChild(defaultEffects);
		this.DOM.appendChild(defaultGroup);
		
		/** PROPS **/
		this.__defineSetter__("x", function(f){
			this.setX(f);
		});
		this.__defineSetter__("y", function(f){
			this.setY(f);
		});
		this.__defineGetter__("x", function(f){
			return this._x;
		});
		this.__defineGetter__("y", function(f){
			return this._y;
		});
		/** /PROPS **/
		
		this.line = {
			width:0,
			color:"#ffffff",
			alpha:1
		};
		this.fill = {
			fill:"none",
			alpha:1
		};
		var toRGB = function(number){
			var string = parseInt(number).toString(16);
			while(string.length < 6){
				string = "0" + string;
			}
			return "#" + string;
		};
		var applyStroke = function(p, ref){
			__(p, {
				"stroke": ref.line.color,
				"stroke-width": ref.line.width,
				"stroke-opacity": ref.line.alpha
			});
			if(ref.line.caps){
				p.setAttribute("stroke-linecap", ref.line.caps);
			}
			if(ref.line.joints){
				p.setAttribute("stroke-linejoin", ref.line.joints);
			}
			if(ref.line.miterLimit){
				p.setAttribute("stroke-miterlimit", ref.line.miterLimit);
			}
		};
		
		var applyFill = function(p, ref){
			__(p, {
				"fill": ref.fill.fill,
				"fill-opacity": ref.fill.alpha
			});
		};
		
		var state = {lastPath : null};
		
		/** Public methods **/
		this.setX = function(x){
			if(!x)
				return;
			this._x = x;
			__(defaultGroup,{
				"transform":"translate(" + this._x + "," + this._y + ")"
			});
		};
		this.setY = function(y){
			if(!y)
				return;
			this._y = y;
			__(defaultGroup,{
				"transform":"translate(" + this._x + "," + this._y + ")"
			});
		};
		this.moveTo = function(params){
			var p = __("path",{
				"d":"M" + params.join(" ")
			});
			applyFill(p, this);
			state.lastPath = p;
			applyStroke(p, this);
			defaultGroup.appendChild(state.lastPath);
		};
		this.lineTo = function(params){
			if(!state.lastPath){
				state.lastPath = __("path",{
					"d":"M0 0"
				});
				applyFill(state.lastPath, this);
				applyStroke(state.lastPath, this);
			}
			__(state.lastPath,{
				"d": state.lastPath.getAttribute("d") + " L" + params.join(" ")
			});
		};
		this.curveTo = function(params){
			if(!state.lastPath){
				state.lastPath = __("path",{
					"d":"M0 0"
				});
				applyFill(state.lastPath, this);
				applyStroke(state.lastPath, this);
			}
			__(state.lastPath,{
				"d": state.lastPath.getAttribute("d") + " Q" + params.join(" ")
			});
		};
		this.lineStyle = function(params){
			if(params.length < 3)
				return;
			this.line.width = params[0];
			this.line.color = toRGB(params[1]);
			this.line.alpha = params[2];
			if(params[3]){
				this.line.caps = params[3];
			}
			if(params[4]){
				this.line.joints = params[4];
			}
			if(params[5]){
				this.line.miterLimit = params[5];
			}
			if(state.lastPath){
				applyStroke(state.lastPath, this);
			}
		};
		this.beginFill = function(params){
			if(params.length === 0)
				return;
			this.fill.fill = toRGB(params[0]);
			if(params.length > 1){
				this.fill.alpha = params[1];
			}
		};
		this.endFill = function(params){
			this.fill.fill = "none";
		};
		this.drawRect = function(params){
			var r = __("rect",{
				"x": params[0],
				"y": params[1],
				"width": params[2],
				"height": params[3]
			});
			applyFill(r, this);
			applyStroke(r, this);
			defaultGroup.appendChild(r);
		};
		this.drawRoundRect = function(params){
			var r = __("rect",{
				"x": params[0],
				"y": params[1],
				"width": params[2],
				"height": params[3],
				"rx":params[4],
				"ry":params[5]
			});
			applyFill(r, this);
			applyStroke(r, this);
			this.DOM.appendChild(r);
		};
		this.drawCircle = function(params){
			var c = __("circle",{
				"cx": params[0],
				"cy": params[1],
				"r": params[2]
			});
			applyFill(c, this);
			applyStroke(c, this);
			defaultGroup.appendChild(c);
		};
		
		this.drawEllipse = function(params){
			var e = __("ellipse",{
				"cx": params[0],
				"cy": params[1],
				"rx": params[2],
				"ry": params[3]
			});
			applyFill(e, this);
			applyStroke(e, this);
			defaultGroup.appendChild(e);
		};
		
		this.drawTriangles = function(params){
			if(params[1].length % 3 !== 0){
				throw new Error("Illegal drawTriangles index argument. Indices array size must be a multiple of 3.");
			}
			for(var i = 0; i < params[1].length / 3; i++){
				var a = params[1][3 * i],
					b = params[1][3 * i + 1],
					c = params[1][3 * i + 2];
				var ax = params[0][2 * a], ay = params[0][2 * a + 1];
				var bx = params[0][2 * b], by = params[0][2 * b + 1];
				var cx = params[0][2 * c], cy = params[0][2 * c + 1];
				this.moveTo([ax,ay]);
				this.lineTo([bx,by]);
				this.lineTo([cx,cy]);
				this.lineTo([ax,ay]);
			}
		};
		
		this.clear = function(){
			while (defaultGroup.lastChild) {
				defaultGroup.removeChild(defaultGroup.lastChild);
			}
		};
		
		this.__defineGetter__("filters", function(f){
			return [];
		});
		this.__defineSetter__("filters", function(f){
			this.setFilters([f]);
		});
		this.setFilters = function(params){
			var filters = params[0];
			//Remove old filters
			this.DOM.removeChild(defaultEffects);
			defaultEffects = __("defs");
			for(var i = 0; i < filters.length; i++){
				var filter = filters[i];
				var dFilter = __("filter",{
					"id":"fe" + filter.type + i,
					"x":"-100%",
					"y":"-100%",
					"width":"400%",
					"height":"400%"
				});
				switch(filter.type){
					default:break;
					case "blur":{
						dFilter.appendChild(__("feGaussianBlur",{
							"in":"SourceGraphic",
							"stdDeviation":filter.params.blurX + " " 
								+ filter.params.blurY,
						}));
					}break;
					case "glow":{
						var cR = Math.floor(filter.params.color / 65536), 
							cG = Math.floor((filter.params.color % 65536)/256), 
							cB = filter.params.color % 256;
						var cMatrix = [
							0,0,0,cR,0,
							0,0,0,cG,0,
							0,0,0,cB,0,
							0,0,0,1,0,
						];
						dFilter.appendChild(__("feColorMatrix",{
							"type":"matrix",
							"values": cMatrix.join(" ")
						}));
						dFilter.appendChild(__("feGaussianBlur",{
							"stdDeviation":filter.params.blurX + " " 
								+ filter.params.blurY,
							"result":"coloredBlur"
						}));
						var m = __("feMerge");
						m.appendChild(__("feMergeNode",{
							"in":"coloredBlur"
						}));
						m.appendChild(__("feMergeNode",{
							"in":"SourceGraphic"
						}));
						dFilter.appendChild(m);
					}break;
				}
				defaultEffects.appendChild(dFilter);
			};
			// Add new filters
			this.DOM.appendChild(defaultEffects);
			// Apply filters
			this.DOM.removeChild(defaultGroupWithEffects);
			var tGroup = defaultGroup;
			for(var i = 0; i < filters.length; i++){
				var layeredG = __("g",{
					"filter":"url(#" + "fe" + filters[i].type + i + ")"
				});
				layeredG.appendChild(tGroup);
				tGroup = layeredG;
			}
			this.DOM.appendChild(tGroup);
			defaultGroupWithEffects = tGroup;
		};
		
		this.unload = function(){
			try{
				stage.removeChild(this.DOM);
			}catch(e){};
		};
		// Hook Child
		stage.appendChild(this.DOM);
	};
	
	ScriptingContext.prototype.Unpack.Sprite = function(stage, data, ctx){
		this.DOM = _("div",{"style":{"position":"absolute"}});
		
		this.setX = function(x){
			this.DOM.style.left = x + "px";
		};
		
		this.setY = function(y){
			this.DOM.style.top = y + "px";
		};
		
		this.setWidth = function(width){
			this.DOM.style.width = width + "px";
		};
		
		this.setHeight = function(height){
			this.DOM.style.height = height + "px";
		};
		
		this.unload = function(){
			try{
				stage.removeChild(this.DOM);
			}catch(e){};
		};
		// Hook child
		stage.appendChild(this.DOM);
	}
	
	// Load all the getClass Prototypes
	for(var cl in ScriptingContext.prototype.Unpack){
		ScriptingContext.prototype.Unpack[cl].prototype.getClass = (function(){
			var n = cl;
			return function(){
				return n;
			} 
		})();
	}
})();
