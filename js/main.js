/*
 *  Brendan Whitfield (C) 2014
 *
 *  Display & event handler
 */


var $window;
var $have;
var $need;
var $add_have;
var $add_need;
var $run;

$(window).load(init); //used .load to ensure CSS values are computed (issues in chrome & safari)

function init()
{
	setVars();
	listen();
	refresh();
	resetResults();
}

function setVars()
{
	$window = $(window);
	$have = $("#have");
	$need = $("#need");
	$add_have = $("#have a.add");
	$add_need = $("#need a.add");
	$run = $("#run");
}

function listen()
{
	$add_have.click(addHave);
	$add_need.click(addNeed);
	$have.find("a.remove").click(remove);
	$need.find("a.remove").click(remove);
	$run.click(run);
}

function refresh()
{
	var $have_items = getItems($have);
	var $need_items = getItems($need);

	//toggle visibility of first listitems "Remove" link
	if($have_items.length == 1)
	{
		$($have_items[0]).find(".remove").addClass("linkDisable"); //hide
	}
	else if($have_items.length > 1)
	{
		$($have_items[0]).find(".remove").removeClass("linkDisable"); //show
	}

	if($need_items.length == 1)
	{
		$($need_items[0]).find(".remove").addClass("linkDisable"); //hide
	}
	else if($need_items.length > 1)
	{
		$($need_items[0]).find(".remove").removeClass("linkDisable"); //show
	}

	//cycle the colors around the wheel
	for(var i = 0; i < $need_items.length; i++)
	{
		$($need_items[i]).find(".colorCode").css(colorForIndex(i));
	}
}

function run()
{
	resetResults();

	var $have_items = getItems($have);
	var $need_items = getItems($need);

	var sources =       new Array();
	var sources_unlim = new Array();
	var segments =      new Array();

	//compile the haves
	for(var i = 0; i < $have_items.length; i++)
	{
		var $c = $($have_items[i]);
		var l = parseNumber($c.find(".length").val());
		var q = parseNumber($c.find(".quantity").val());

		if(!isNaN(l))
		{
			if(isNaN(q)) //unlimited quantity
			{
				var obj = {length:l}; //make piece
				sources_unlim.push(obj);
			} 
			else //given quantity
			{
				for(var j = 0; j < q; j++)
				{
					var obj = {length:l}; //make piece
					sources.push(obj);
				}
			}
		}
		else
		{
			displayError("Please enter a valid length measurement");
			return;
		}
	}

	//compile the needs
	for(var i = 0; i < $need_items.length; i++)
	{
		var $c = $($need_items[i]);
		var c = $c.find(".colorCode").css("background-color");
		var l = parseNumber($c.find(".length").val());
		var q = parseNumber($c.find(".quantity").val());

		if(!isNaN(l))
		{
			if(!isNaN(q))
			{
				for(var j = 0; j < q; j++)
				{
					var obj = {length:l, color:c}; //make piece
					segments.push(obj);
				}
			}
			else
			{
				displayError("Please enter a valid desired quantity");
				return;
			}
		}
		else
		{
			displayError("Please enter a valid length measurement");
			return;
		}
	}

	var settings = {mode:selectIndex($("#mode")),
					kerf:parseNumber($("#kerf").val())};

	var result = segmenter.run(sources, sources_unlim, segments, settings); //the magic call

	if(result.success)
	{
		displayResults(result.data, kerf);
	}
	else
	{
		displayError(result.data);
	}

	console.log("done");
}

function displayResults(results, kerf)
{
	$("#done").show();

	//find the largest source piece and the display elements
	var largestSource = 0;
	for(var i = 0; i < results.length; i++)
	{
		if(i > 0) { addResult(); } //add more result readouts
		if(results[i].length > largestSource) { largestSource = results[i].length; }
	}

	var $rs = $("section.result");
	$rs.show();

	//compute the scale factor mapping inches to pixels
	var canvasWidth = $("canvas").eq(0).width();
	var canvasHeight = $("canvas").eq(0).height();
	var scaleFactor = canvasWidth / largestSource;

	//configure each piece to show its contents
	for(var i = 0; i < results.length; i++)
	{
		var result = results[i];
		var r = $rs[i];

		//set the length text
		var text = r.getElementsByTagName("h1")[0];
		text.innerHTML = (Math.round(result.length * 100) / 100) + "&quot;";

		//get the canvas and context
		var canvas = r.getElementsByTagName("canvas")[0];
		var ctx = canvas.getContext('2d');

		//calculate the relative width of the piece
		var sourceLength = Math.round(result.length * scaleFactor);

		//draw the grey background
		ctx.fillStyle = "rgb(200,200,200)";
		ctx.fillRect(0,0,sourceLength,canvasHeight);

		//set the font for this canvas
		ctx.font = "11pt Arial";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";

		//loop for contents
		var offset = 0; //pixels used on current segment
		for(var s = 0; s < result.segments.length; s++)
		{
			var seg = result.segments[s];
			var width = Math.round((seg.length + kerf) * scaleFactor);

			//draw the segment
			ctx.fillStyle = seg.color;
			ctx.fillRect(offset, 0, width, canvasHeight);

			//write the segment length
			var middle = offset + (width / 2);
			ctx.fillStyle = "#000";
			ctx.fillText(seg.length + "\"", middle, (canvasHeight / 2));

			//draw the kerf if it's NOT the last segment
			if(s != result.segments.length - 1)
			{
				ctx.fillRect(offset + width -1, 0, 1, canvasHeight);
			}

			//advance the offset
			offset += width;
		}
	}
}

function displayError(data)
{
	resetResults();
	var $e = $("#error");
	$e.find("h2").text(data);
	$e.show();
}


function resetResults()
{
	$("#error").hide();
	$("#done").hide();

	//reduce to one result section
	var $results = $("section.result");
	for(var i = 1; i < $results.length; i++)
	{
		$($results[i]).remove();
	}

	//hide the result, and delete all of itsa Segments
	$($results[0]).hide().find(".segment").remove();
}

function addResult()
{
	var $results = $("section.result");
	var $last = $($results.last());
	var $clone = $last.clone(false);
	$clone.insertAfter($last);
}

function addHave(event)
{
	event.preventDefault();
	addItem($have);
	refresh();
}

function addNeed(event)
{
	event.preventDefault();
	addItem($need);
	refresh();
}

//clones the last item in the list and appends it
function addItem($list)
{
	var $items = getItems($list);
	var $last = $($items.last());
	var $clone = $last.clone(true);
	$clone.find(".remove").removeClass("linkDisable"); //show
	$clone.insertAfter($last);
}

function remove(event)
{
	event.preventDefault();
	
	var $button = $(event.target);
	$button.parent().remove();

	refresh();
}

function getItems($list)
{
	return $list.find("li:not(li.add)");
}