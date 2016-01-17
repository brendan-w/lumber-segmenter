/*
 *  Brendan Whitfield (C) 2014
 *  
 *  Solves for a SUB-OPTIMAL cut pattern.
 *  sources are filled one board at a time, minimizing loss on a per-board basis
 *  boards are filled with any combination of segments
 */


//NOTE: this borrows the recursive fill_board() function from the optimal solver


var suboptimal = {
    run:function(job) {

        var layout = [];

        //these are purely for progress reporting
        var n_cuts_total = cuts_left(job);
        var n_cuts_left;

        //while there are cuts and sources left to work with
        while((n_cuts_left = cuts_left(job)) > 0 && sources_left(job) > 0)
        {
            //send progress updates based on how many cuts we've made so far
            var cuts_made = (n_cuts_total - n_cuts_left);
            emit("progress", cuts_made / n_cuts_total);

            //fill another board
            var filled_board = suboptimal.choose_board(job);

            //if we were unable to fill any of the source boards with a cut pattern,
            //then we've hit the end of the road. This can happen, for instance,
            //all of the cuts are too big for any of the sources.
            if(filled_board.cut_indices.length == 0)
                return null; //total layout failure

            job.sources[filled_board.source_index].quantity--; //deduct
            layout.push(filled_board);
            allocate_cuts(job, filled_board); //decrement the quantities of cuts accordingly
        }

        //for cases where the sources ran out before the cuts
        if(cuts_left(job) > 0)
            layout = null;

        return layout;
    },


    //loops through source types, and selects the board that, when cut,
    //generated the least loss. Returns the choosen board
    choose_board:function(job) {

        var best_board;

        //loop through our choices of length for the source boards
        job.sources.forEach(function(source, s) {

            if(source.quantity == 0)
                return; //skip spent sources

            //try filling this source length
            var filled_board = optimal.fill_board(job, make_board(job, s));

            //see if this solution is any better than the last
            if((!best_board) || (filled_board.space_left < best_board.space_left))
                best_board = filled_board;
        });

        return best_board;
    }
};
