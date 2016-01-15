
var $sources;
var $desires;
var $output;
var $errors;


$(function() {
	$sources = $("#sources");
	$desires = $("#desires");
	$output = $("#output");
	$errors = $("#errors");

	$("#add-source").click(function(e) {
		add_item($sources);
	});

	$("#add-desire").click(function(e) {
		add_item($desires);
	});

	$(".delete").on("click", function(e) {
		$(this).closest("tr").remove();
		re_color(); //update the color codes
	});

	$("#run").click(run);

	re_color(); //color the initial list item
	resize();
});


function run(e)
{
	reset_display();

	var error = false;

	var mode          = $("#mode").val();
	var kerf          = parse_compound_float($("#kerf").val());
	var sources       = [];
	var sources_unlim = [];
	var desires       = [];


	//fill the arrays above
	$sources.find("tbody tr").each(function(i, row) {
		var l = parse_compound_float($(row).find(".length").val());
		var q = parseInt($(row).find(".quantity").val());

		if(!isNaN(l))
		{
			if(isNaN(q)) //unlimited quantity
			{
				sources_unlim.push({ length: l });
			} 
			else //given quantity
			{
				for(var j = 0; j < q; j++)
				{
					sources.push({ length: l });
				}
			}
		}
		else
		{
			log_error("Source #" + i + ": invalid length measurement");
			error = true;
		}
	});


	$desires.find("tbody tr").each(function(i, row) {
		var l = parse_compound_float($(row).find(".length").val());
		var q = parseInt($(row).find(".quantity").val());
		var c = $(row).find(".length").css("background-color");

		if(isNaN(l))
		{
			log_error("Cut #" + i + ": invalid length measurement");
			error = true;
		}
		else
		{
			if(isNaN(q)) //unlimited quantity
			{
				log_error("Cut #" + i + ": invalid quantity");
				error = true;
			} 
			else //given quantity
			{
				for(var j = 0; j < q; j++)
				{
					desires.push({
						length: l,
						color: c
					});
				}
			}
		}

	});


	if(error)
		return;

	var result = segmenter.run(mode, kerf, sources, sources_unlim, desires); //the magic call

	if(result.success)
		display_results(result.data, kerf);
	else
		log_error(result.data);
}


function display_results(results, kerf)
{

	//compute the scale factor mapping inches to pixels
	var canvasWidth = 900;
	var canvasHeight = 20;
	var scaleFactor = canvasWidth / largest_result(results);

	//configure each piece to show its contents
	results.forEach(function(result) {

		var $r = add_result();

		//calculate the relative width of the piece
		var sourceLength = Math.round(result.length * scaleFactor);

		//set the length text
		$r.find("h1").text(Math.round(result.length * 100) / 100);

		//get the canvas and context
		var ctx = $r.find("canvas")[0].getContext('2d');

		//draw the grey background
		ctx.fillStyle = "rgb(200,200,200)";
		ctx.fillRect(0, 0, sourceLength, canvasHeight);

		//set the font for this canvas
		ctx.font = "11pt Arial";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		//loop for contents
		var offset = 0; //pixels used on current segment

		result.segments.forEach(function(segment, s) {
			var width = Math.round((segment.length + kerf) * scaleFactor);

			//draw the segment
			ctx.fillStyle = segment.color;
			ctx.fillRect(offset, 0, width, canvasHeight);

			//write the segment length
			var middle = offset + (width / 2);
			ctx.fillStyle = "#000";
			ctx.fillText(segment.length, middle, (canvasHeight / 2));

			//draw the kerf if it's NOT the last segment
			if(s != result.segments.length - 1)
			{
				ctx.fillRect(offset + width -1, 0, 1, canvasHeight);
			}

			//advance the offset
			offset += width;
		});
	});

	$output.show();
}


function resize()
{
	//recalculate the size of output canvas'

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
	var $el = $("<li><h1></h1><canvas width='900' height='20'></canvas></li>")
	$output.append($el);
	return $el;
}

//generic error string handler
function log_error(str)
{
	console.log(str);
	$errors.text($errors.text() + "\n" + str);
	$errors.show();
}

//generic adder that clones the previous table row
function add_item($table)
{
	var $last = $table.find("tbody").children().last();
	$table.append($last.clone(true));
	re_color(); //update the color codes
}

//recolors the list of desired cuts
function re_color()
{
	$desires.find("tbody tr").each(function(i, row) {
		var color = color_for_index(i);
		$(row).find(".length").css(color);
		$(row).find(".quantity").css(color);
	});
}

function reset_display()
{
	$output.hide();
	$output.empty();
	$errors.empty();
}
