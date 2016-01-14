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
	});
});


//generic adder that clones the previous table row
function add_item($table)
{
	var $last = $table.find("tbody").children().last();
	$table.append($last.clone(true));
}
