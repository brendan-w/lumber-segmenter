
# NOTE: this needs to be run in an NPM environment for access to module bins

# files --------------------------------

CSS = node_modules/reset.css/reset.css \
      css/style.css

# bundle for the UI
JS_UI = js/utils.js \
        js/main.js

# bundle for the solver worker
JS_SOLVER = js/solver/full_solve.js \
            js/solver/fast_solve_1.js \
            js/solver/fast_solve_2.js \
            js/solver/segmenter.js
            

# flags --------------------------------

LESS_FLAGS = --strict-math=on --strict-units=on
UGLIFY_FLAGS = --compress --mangle --screw-ie8

# targets ------------------------------

.PHONY: all
all: index.html

index.html: index.mustache style.css ui.js solver.js
	mustache $(foreach f, $^, -p $(f) ) package.json index.mustache > $@

ui.js: $(JS_UI)
	cat $^ | uglifyjs $(UGLIFY_FLAGS) > $@

solver.js: $(JS_SOLVER)
	cat $^ | uglifyjs $(UGLIFY_FLAGS) > $@

style.css: $(CSS)
	cat $^ | lessc $(LESS_FLAGS) - | cleancss > $@

.PHONY: clean
clean:
	rm -f index.html style.css ui.js solver.js
