/*
 *  Brendan Whitfield (C) 2014
 *  
 *  Solves for the OPTIMAL cut pattern (least possible loss).
 *  Solutions are traversed recursively.
 *  Solutions are judged based on their total loss and the distribution of that loss.
 */




var full_solve = {


    run:function(job) {

        var best_layout = null;

        //the stats for the best layout
        var best_loss; //minimize this
        var best_clumping; //TODO

        full_solve.choose_source(job, [], function(layout) {
            
            var loss = loss_in_layout(layout);

            if((!best_layout) || (loss < best_loss))
            {
                best_layout = layout;
                best_loss   = loss;
            }
        });

        return best_layout;
    },

    //WARNING: recursive
    choose_source: function(job, layout, reveal_candidate) {

        if(cuts_left(job) > 0)
        {
            //loop through every length (type) of source material
            job.sources.forEach(function(source, s) {

                if(source.quantity == 0)
                    return; //skip spent sources

                //compute a cut layout for this source
                var filled_board = full_solve.fill_board(job, make_board(job, s));

                //if this board couldn't be cut... at all...
                //this can happen when all of the cut sizes are larger than the remaining boards
                if(filled_board.cut_indices.length == 0)
                {
                    //dont reveal incomplete candidates
                    return; //don't recurse
                }

                source.quantity--; //deduct
                layout.push(filled_board);
                allocate_cuts(job, filled_board); //decrement the quantities of cuts accordingly

                //recurse for the next source board
                full_solve.choose_source(job, layout, reveal_candidate);

                deallocate_cuts(job, filled_board); //replace the quantities of cuts
                layout.pop();
                source.quantity++;
            });
        }
        else
        {
            //solution has been reached
            reveal_candidate(clone_layout(layout));
        }
    },






    //wrapper function around the recursive board cutter.
    //Stores and returns the best solution.
    fill_board: function(job, board) {

        var best_board; //the layout with the least loss

        full_solve.cut_board(job, board, function(filled_board) {

            //see if this solution is any better than the last
            if((!best_board) || (filled_board.space_left < best_board.space_left))
                best_board = filled_board;
        });

        return best_board;
    },

    //WARNING: recursive
    //tries to make another cut
    cut_board: function(job, board, reveal_candidate) {

        //if there's work left to do on this board
        if((board.space_left > 0) && (cuts_left(job) > 0))
        {
            //loop through every length (type) of cut still available
            job.cuts.forEach(function(cut, c) {

                if(cut.quantity == 0)
                    return; //skip spent cut sizes

                //if this cut size is too long for the remaining space
                if(board.space_left < cut.length)
                {
                    //there's a chance that this is all we'll get out of this board.
                    //The rest is simply loss. So, whenever we run into a piece that's too big,
                    //report it anyway. Also handles cases where NO cuts could be made,
                    //because the board might have been too small for ANY of our cut sizes.
                    reveal_candidate(clone_board(board));
                    return; //don't recurse
                }

                //if we've made it this far, then there is enough space for our cut size

                //take note of this, so we can un-cut our board
                var old_space_left = board.space_left;

                //make the cut
                cut.quantity--; //deduct from the quantity of this cut size
                board.cut_indices.push(c);
                board.space_left -= cut.length + job.settings.kerf;
                //yes, the above can yeild negative values for a filled board
                //but, becuase of the gaurd above, we are gauranteed that
                //(board.space_left >= cut.length)

                //recurse for the next cut
                full_solve.cut_board(job, board, reveal_candidate);

                //undo the cut
                board.space_left = old_space_left;
                board.cut_indices.pop()
                cut.quantity++;
            });
        }
        else
        {
            //board has been filled, or we've finished up all of the desired cuts
            //clone, don't expose the actual object that we're fiddeling with 
            reveal_candidate(clone_board(board));
        }
    },

};
