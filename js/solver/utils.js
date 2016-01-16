

//returns the number of cuts left to make on a job
//will return Infinity if one or more sources are unlimited
function sources_left(job) {
    var total = 0;
    for(var i = 0; i < job.sources.length)
        total += job.sources[i].quantity;
    return total;
}


//returns the number of cuts left to make on a job
function cuts_left(job) {
    var total = 0;
    for(var i = 0; i < job.cuts.length)
        total += job.cuts[i].quantity;
    return total;
}






/*
    handlers for the output of a parser:

    [
        //board, with a list of it's cuts
        {
            source_index: x,
            space_left: x,
            cut_indices: [ cut_index, ... ]
        },
        ...
    ]

    Sources become "boards" when they carry cut information
    A "layout" is simply a list of "board" objects.
*/



//model used to represent filled (cut) source material (boards)
//run() returns a list of these
function make_board(job, s)
{
    return {
        source_index : s,
        space_left   : job.sources[s].length,
        cut_indices  : [],
    };
},

//used when we stow the best permutation of cuts on a board
function clone_board(board)
{
    return {
        source_index : board.source_index,
        space_left   : board.space_left,
        cut_indices  : board.cut_indices.slice(0),
    };
},

//used when we stow the best permutation of an entire layout (list of boards)
function clone_layout(layout)
{
    var new_layout = [];
    layout.forEach(function(board) {
        new_layout.push(clone_board(board));
    });
    return new_layout;
},

//computes the total space_left for on the boards in a layout
function loss_in_layout(layout)
{
    var total = 0;

    layout.forEach(function(board) {
        var space_left = board.space_left;

        //in cases where space_left is negative (the kerf overflows the end of the board)
        //peg the at zero
        space_left = (space_left < 0) ? 0 : space_left;

        total += space_left;
    });

    return space_left;
}
