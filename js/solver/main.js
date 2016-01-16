/*
 *  Brendan Whitfield (C) 2014
 *  
 *  This file acts as a driver for the various solvers.
 *  Since the solvers work on discrete input, unlimited sources are handled here.
 *  
 */


function descending_length(a, b) { return b.length - a.length; }

function run(job)
{
    console.log("Job Started", job);

    //picks discrete quantity values for sources marked as infiniteS
    //TODO: resolve quantities of Infinity to actual counts
    handle_infinity(job);

    //Having the solvers allocate the bigger cuts first will cause
    //boards to fill up faster, which rapidly disqualifies choices,
    //and helps speed the process along. This way, you won't waste
    //time piling on a bunch of small pieces, only to find that you
    //have no room for your big pieces.
    job.sources.sort(descending_length);
    job.cuts.sort(descending_length);

    //SOLVE
    var layout = full_solve.run(job);;

    if(layout)
        emit("success", {
            settings : job.settings,
            layout : resolve_to_user_objects(job, layout),
        });
    else
        emit("failure", "failed to compute layout");
}


//Resolves infinite quantities to discrete quantities.
//For each type of infinite source, set the quantity to the total
//number of cuts. This ensures that there is at least one source
//board for every cut. Since sources are clumped by size type, it's
//okay for these source quantities to be very large.
function handle_infinity(job)
{
    var n_cuts = cuts_left(job);

    job.sources.forEach(function(source) {
        if(source.quantity == Infinity)
            source.quantity = n_cuts;
    });
}


/*
    converts a layout (list of board objects) into clones of the original
    source and cut objects given to the solver. Deletes the quantity fields,
    since the layout is solved.

    output:

    [
        // a clone of the source board
        {
            length: x,
            any_other_user_defined_prop: x,
            cuts: [
                // a clone of the cut object
                {
                    length: x,
                    any_other_user_defined_prop: x,
                    color: x,
                },
                ...
            ]
        },
        ...
    ]
*/
function resolve_to_user_objects(job, layout)
{
    var output = [];

    layout.forEach(function(board) {

        var output_board = clone(job.sources[board.source_index]);
        delete output_board.quantity; //useless property

        //add the information we just calculated
        output_board.loss = board.space_left;
        output_board.cuts = [];

        board.cut_indices.forEach(function(c) {
            var output_cut = clone(job.cuts[c]); //lookup the original cut object, and clone it
            delete output_cut.quantity; //this should be zero, since all cuts were performed
            output_board.cuts.push(output_cut);
        });

        output_board.cuts.sort(descending_length);

        output.push(output_board);
    });

    return output;
}


//all messages start a new cut job
onmessage = function(e) { run(e.data); };
