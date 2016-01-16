
var solver_worker;

var $sources;
var $cuts;
var $output;
var $print;
var $errors;
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
    $welcome = $("#welcome");

    $("#add-source").click(function(e) {
        add_item($sources);
    });

    $("#add-cut").click(function(e) {
        add_item($cuts);
    });

    $(".delete").on("click", function(e) {
        $(this).closest("tr").remove();
        re_color(); //update the color codes
    });

    $("#run").click(run);

    $print.find("button").click(function(e) {
        window.print();
    });

    re_color(); //color the initial list item
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
        {
            log_error("Source #" + i + ": invalid length measurement");
            return; //skip
        }

        q = isNaN(q) ? Infinity : q; //mark unlimited quantities
        job.sources.push({ length: l, quantity: q });
    });


    $cuts.find("tbody tr").each(function(i, row) {
        var l = parse_compound_float($(row).find(".length").val());
        var q = parseInt($(row).find(".quantity").val());
        var c = $(row).find(".color").css("background-color");

        if(isNaN(l))
        {
            log_error("Cut #" + i + ": invalid length measurement");
            return; //skip
        }
        
        if(isNaN(q))
        {
            log_error("Cut #" + i + ": invalid quantity");
            return; //skip
        } 

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
}


function on_solver_message(e)
{
    var result = e.data;
    if(result.type == "success")
        //TODO: get actual kerf
        display_results(result.data, (3/16));
    else if(result.type == "failure")
        log_error(result.data);
}


function display_results(results, kerf)
{
    //compute the scale factor mapping measurements to pixels
    var scale = canvas_width / largest_result(results);

    //configure each piece to show its contents
    results.forEach(function(result) {

        var $r = add_result();

        //calculate the relative width of the piece
        var source_pix_length = Math.round(result.length * scale);

        //set the length text
        $r.find("h1").text(Math.round(result.length * 100) / 100);

        //get the canvas and context
        var ctx = $r.find("canvas")[0].getContext('2d');

        //draw the grey background
        ctx.fillStyle = canvas_bg;
        ctx.fillRect(0, 0, source_pix_length, canvas_height);

        //set the font for this canvas
        ctx.font = "normal 11pt Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        //loop for contents
        var offset = 0; //pixels used on current segment

        result.segments.forEach(function(segment, s) {
            var width = Math.round((segment.length + kerf) * scale);

            //draw the segment
            ctx.fillStyle = segment.color;
            ctx.fillRect(offset, 0, width, canvas_height);

            //write the segment length
            ctx.fillStyle = "#000";
            ctx.fillText(segment.length,       //text
                         offset + (width / 2), //X
                         (canvas_height / 2)); //Y

            //draw the kerf if it's NOT the last segment
            if(s != result.segments.length - 1)
            {
                ctx.fillRect(offset + width -1, 0, 1, canvas_height);
            }

            //advance the offset
            offset += width;
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


//used for scaling the graphics appropriately
function largest_result(results)
{
    var largest = 0;
    results.forEach(function(r) {
        if(r.length > largest)
            largest = r.length;
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
    console.log(str);
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
    re_color(); //update the color codes
}

//recolors the list of cuts
function re_color()
{
    $cuts.find("tbody tr").each(function(i, row) {
        $(row).find(".color").css(color_for_index(i));
    });
}

//resets the display, and kills the worker (if running)
function reset_all()
{
    $welcome.hide();
    $output.hide();
    $output.empty();
    $print.hide();
    $errors.empty();

    if(solver_worker)
    {
        solver_worker.terminate();
        solver_worker = null;
    }
}
