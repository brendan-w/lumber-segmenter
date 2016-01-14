/*
 *  Brendan Whitfield (C) 2014
 *
 *  Display & event handler
 */

var $sources;
var $desires;


$(function() {
	$sources = $("#sources");
	$desires = $("#desires");

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

	re_color();
});


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
