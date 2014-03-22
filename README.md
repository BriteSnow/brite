# brite.js
brite.js is a simple but powerful DOM centric MVC (D-MVC) framework for building high-end HTML5 applications.
The driving concept is to just add the missing MVC pieces to the DOM rather than force fitting Desktop MVC
and Widget patterns to the DOM. The result is simpler, easier to optimize, and more scalable HTML/CSS/JS
application code. In short, brite turns the DOM (and jQuery) into a robust, efficient, and scalable MVC platform.

__MIT__ licensed | [brite.min.js](https://raw2.github.com/BriteSnow/brite/master/dist/brite.min.js) | [documentation](http://britesnow.com/brite) | [Sample App (TodoMVC)](https://github.com/BriteSnow/sampleTodoMVC) | [Release Log](#release-log) | [more dist](https://github.com/BriteSnow/brite/tree/master/dist)



## Quick Overview

Create a new view definition

```javascript

// brite.registerView(VIEW_NAME,VIEW_DEFINITION_CREATE_INIT_POSTDISPLAY_DESTROY)
brite.registerView("MyView",{
    // REQUIRED: can return a HTML string, DOM Element, jQuery object
    create: function(data,config){
        return "<div>My <button>Button</button></div>";
    }, 

    // optional (if present, this will be called after the element will be displayed)
    postDisplay(data,config){
        // usually a good place to do anything which is not UI related 
        // (since it will be called after it is displayed )
        var view = this; // best practice (the this is the view instance)
        // .$el is the jQuery object of the first view DOM element (i.e. <div> created in the create )
        view.$el.addClass("some-state-class");
    }, 

    // optional (convenient way to bind events at the view level)
    events: {
        // "TYPE;SELECTOR" will internally make a simple jquery binding call view.$el.on(TYPE,SELECTOR) call;
        "click; button": function(event){
            var view = this; // the this is the view (makes it very OO)
            console.log("A button has been clicked in view " + view.id);
        }
    }
    // more things, such as init, destroy, winEvents, docEvents, and daoEvents 
    // (see http://britesnow.com/brite for more info)
})
```

Display instances of MyView

```javascript
// brite.display(VIEW_NAME,JQUERY_SELECTOR_OR_OBJECT_OR_DOM_ELEMENT)
// This will create a new instance of MyView and append it to body
brite.display("MyView","body");

brite.display("MyView",$("body")); // same as above. 

// View lifecycle is async (using jQuery promise)
brite.display("MyView","body").done(function(myViewInstance){
    console.log("This view unique instance id is: " + myViewInstance.id);
});

```

*IMPORTANT*: Remember that the concept of brite.js is not to make everything a "View" or widget, but rather to partition the User Interface into reusable composite views (that usually become brite.js views) and smaller HTML elements that should be just HTML/CSS based with their respective delegated behavior (Bootstrap is a great base for those type of components). 

## Component Usage

`component.json`

    {
        …
        dependencies: {
            "BriteSnow/brite": "*"
            …
        }
        …
    }

## Release Log
Notation: "+" Addition | "-" Fix | "!" API change | "*" Important | "." minor

#### 1.1.2 (March 22nd 2014)
* + added brite.config.jsPath and brite.config.cssPath for configuring the location of the brite view components when using on demand loading
* . updated examples to jquery 1.11
* . minor reformating to be more jshint compliant. Updated to bootstrap 3.1.1
* . update to handlebars 1.3.0 and fix taskmanager with latest bootstrap
* + Makes brite.js compatible with AMD and CommonJS (Thanks to [Sankar Gorthi](https://github.com/sankargorthi))
* . updated sample/taskmanager to point correctly to the bootstrap 3.0 and use handlebars-1.0.0
* ! remove the brite.gtx (canvas utilities) from brite (moved gtx.js to /extra)
* - btap issue when binding only on parent, btap on child does not propagate
* - Fix btap event to fire only once (without the use of preventDefault which would be too destructive for other event handlers)


