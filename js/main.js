
var solver_worker;

var $sources;
var $cuts;
var $output;
var $print;
var $errors;
var $progress;
var $welcome;

var canvas_width = 800; //will get overwritten in resize()
var canvas_height = 20;

//constants
var canvas_bg = "#888";
var max_canvas_width = 800;


$(function() {
    $sources = $("#sources");
    $cuts = $("#cuts");
    $output = $("#output");
    $print = $("#print");
    $errors = $("#errors");
    $progress = $("#progress");
    $welcome = $("#welcome");

    $("#add-source").click(function(e) {
        add_item($sources);
        update_delete();
    });

    $("#add-cut").click(function(e) {
        add_item($cuts);
        update_delete();
    });

    $(".delete").on("click", function(e) {
        $(this).closest("tr").remove();
        update_colors(); //update the color codes
        update_delete();
    });

    //click or press [Enter] to run the solver
    $("#run").click(run);
    $(window).keypress(function(e) {
        if(e.keyCode == 13)
            run();
    });

    $print.find("button").click(function(e) {
        window.print();
    });

    update_colors(); //color the initial list item
    update_delete(); //updates whether the delete buttons are shown
    resize();
    reset_all();

    $welcome.show();
});


function run(e)
{
    reset_all(); //kills the old worker

    //make a new job for the solver
    var job = {
        settings : {
            mode : $("#mode").val(),
            kerf : parse_compound_float($("#kerf").val()),
        },
        sources : [],
        cuts : [],
    };

    //fill the arrays above
    $sources.find("tbody tr").each(function(i, row) {
        var l = parse_compound_float($(row).find(".length").val());
        var q = parseInt($(row).find(".quantity").val());

        if(isNaN(l))
            log_error("Source #" + i + ": invalid length measurement");

        q = isNaN(q) ? Infinity : q; //mark unlimited quantities
        job.sources.push({ length: l, quantity: q });
    });


    $cuts.find("tbody tr").each(function(i, row) {
        var l = parse_compound_float($(row).find(".length").val());
        var q = parseInt($(row).find(".quantity").val());
        var c = $(row).find(".color").css("background-color");

        if(isNaN(l))
            log_error("Cut #" + i + ": invalid length measurement");

        if(isNaN(q))
            log_error("Cut #" + i + ": invalid quantity");

        job.cuts.push({
            length: l,
            quantity: q,
            color: c
        });
    });

    //don't continue until all errors are handled
    if(has_error())
        return;


    solver_worker = new Worker("solver.js");
    solver_worker.onmessage = on_solver_message; //subscribe to messages

    //start the job
    solver_worker.postMessage(job);

    // set_progress(0);
    // $progress.show();
}


function on_solver_message(e)
{
    var message = e.data;

    switch(message.type)
    {
        case "success":
            $progress.hide();
            display_results(message.data);
            break;
        case "failure":
            $progress.hide();
            log_error(message.data);
            break;
        case "progress":
            // set_progress(message.data);
            break;
    }
}


function display_results(results)
{
    //compute the scale factor mapping measurements to pixels
    var scale = canvas_width / largest_board(results);

    //configure each piece to show its contents
    results.layout.forEach(function(board) {

        var $r = add_result();

        //calculate the relative width of the piece
        var source_length_px = Math.round(board.length * scale);

        //set the length text
        $r.find("h1").text(Math.round(board.length * 100) / 100);

        //get the canvas and context
        var ctx = $r.find("canvas")[0].getContext('2d');

        //draw the grey background
        ctx.fillStyle = canvas_bg;
        ctx.fillRect(0, 0, source_length_px, canvas_height);

        //set the font for this canvas
        ctx.font = "normal 11pt Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        //loop for contents
        var offset = 0; //pixels used on current cut

        //compute the kerf width in pixels
        var kerf = results.settings.kerf * scale;
        kerf = Math.max(Math.round(kerf), 1); //peg the width of the kerf at 1 pixel

        board.cuts.forEach(function(cut) {

            var size           = Math.round(cut.length * scale);
            var size_with_kerf = Math.round((cut.length + results.settings.kerf) * scale);

            //draw the cut
            ctx.fillStyle = cut.color;
            ctx.fillRect(offset, 0, size_with_kerf, canvas_height);

            //write the cut length
            ctx.fillStyle = "#000";
            ctx.fillText(cut.length,           //text
                         offset + (size / 2),  //X
                         (canvas_height / 2)); //Y

            //advance the offset
            offset += size_with_kerf;

            //draw the kerf
            ctx.fillRect(offset - kerf, 0, kerf, canvas_height);
        });
    });

    $output.show();
    $print.show();
}


function resize()
{
    //recalculate the size of output canvas'
    canvas_width = $output.width() - 104; //TODO: this is an experimentally determined value
    canvas_width = (canvas_width > max_canvas_width) ? max_canvas_width : canvas_width;
}

//sets the progress bar to a given percentage [0,1]
function set_progress(value)
{
    var w = Math.round($progress.width() * value);
    $progress.find(".bar").width(w);
}

//used for scaling the graphics appropriately
function largest_board(results)
{
    var largest = 0;
    results.layout.forEach(function(board) {
        if(board.length > largest)
            largest = board.length;
    });
    return largest;
}


function add_result()
{
    var $el = $(" \
    <li> \
        <h1></h1> \
        <canvas width='" + canvas_width + "' height='" + canvas_height + "'></canvas> \
    </li>");
    $output.append($el);
    return $el;
}

//generic error string handler
function log_error(str)
{
    $errors.html($errors.html() + "<br>" + str);
    $errors.show();
}

//test for errors in the log
function has_error()
{
    return $errors.html().length > 0;
}

//generic adder that clones the previous table row
function add_item($table)
{
    var $last = $table.find("tbody").children().last();
    $table.append($last.clone(true));
    update_colors(); //update the color codes
}

//recolors the list of cuts
function update_colors()
{
    $cuts.find("tbody tr").each(function(i, row) {
        $(row).find(".color").css(color_for_index(i));
    });
}

//only allow users to delete things when there is more than one
//of them in the list.
function update_delete()
{
    //sources
    var show_sources = $sources.find("tbody tr").length > 1;
    $sources.find("tbody tr .delete").toggle(show_sources);

    //cuts
    var show_cuts = $cuts.find("tbody tr").length > 1;
    $cuts.find("tbody tr .delete").toggle(show_cuts);
}

//resets the display, and kills the worker (if running)
function reset_all()
{
    $welcome.hide();
    $output.hide();
    $output.empty();
    $print.hide();
    $errors.empty();
    $progress.hide();

    if(solver_worker)
    {
        solver_worker.terminate();
        solver_worker = null;
    }
}
