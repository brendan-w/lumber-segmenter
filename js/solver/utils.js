

//the format for all messages
function emit(type, data)
{
    postMessage({
        type: type,
        data: data,
    });
}


function clone(obj)
{
    if (obj == null || typeof obj != "object")
    {
        console.error("unimplemented clone() of non-object type");
        return obj;
    }

    var copy = obj.constructor();
    
    for (var attr in obj)
    {
        if (obj.hasOwnProperty(attr))
            copy[attr] = obj[attr];
    }
    
    return copy;
}


//returns the number of cuts left to make on a job
//will return Infinity if one or more sources are unlimited
function sources_left(job)
{
    var total = 0;
    for(var i = 0; i < job.sources.length; i++)
        total += job.sources[i].quantity;
    return total;
}


//returns the number of cuts left to make on a job
function cuts_left(job)
{
    var total = 0;
    for(var i = 0; i < job.cuts.length; i++)
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
}

//used when we stow the best permutation of cuts on a board
function clone_board(board)
{
    return {
        source_index : board.source_index,
        space_left   : board.space_left,
        cut_indices  : board.cut_indices.slice(0),
    };
}

//used when we stow the best permutation of an entire layout (list of boards)
function clone_layout(layout)
{
    var new_layout = [];
    layout.forEach(function(board) {
        new_layout.push(clone_board(board));
    });
    return new_layout;
}

//computes the total space_left for every board in the layout
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

    return total;
}


//deducts the quantites of cuts that a filled board consumes
function allocate_cuts(job, board)
{
    board.cut_indices.forEach(function(c) {
        job.cuts[c].quantity--;
    });
}

//replaces the quantites of cuts that a filled board consumes
function deallocate_cuts(job, board)
{
    board.cut_indices.forEach(function(c) {
        job.cuts[c].quantity++;
    });
}


/*
    Used to determine whether the loss in the given layout is concentrated
    or is spread out (which is obnoxious).

    For instance, a good case:

         |
         |           |
         |           |
    loss |           |
         |           |
         |           |
         |. . . . . .|. . . . average loss
         |     |     |   |
         |_|_|_|_|_|_|_|_|_|_

           individual boards

    Or, a bad case:


         |
         |
         |
    loss |     |
         |.|. .|. . . . .|.|. average loss
         | | | |   | | | | |
         | | | | | | | | | |
         | | | | | | | | | |
         |_|_|_|_|_|_|_|_|_|_

           individual boards

    So, I'm defining clumping as the percent of the loss above average:

        loss_above_average_line / total_loss

    This yeilds a normalized value, where:
        1 = best clumping
        0 = worst clumping
*/
function clumping_in_layout(layout)
{
    //TODO
}
