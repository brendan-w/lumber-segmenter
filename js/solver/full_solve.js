/*
 *  Brendan Whitfield (C) 2014
 *  
 *  Solves for the OPTIMAL cut pattern (least possible loss).
 *  Solutions are traversed recursively.
 *  Solutions are judged based on their total loss and the distribution of that loss.
 *  
 *  Segments = desired cuts of wood (Want)
 *  Sources = stock to be cut (HAVE)
 */




var full_solve = {

    /*
        output:

        [
            //source, with a list of it's cuts
            {
                source_index: x,
                space_left: x,
                cut_indices: [ cut_index, ... ]
            },
            ...
        ]
    */


    //model used to represent filled (cut) source material (boards)
    //run() returns a list of these
    make_output_board: function(job, s) {
        return {
            source_index: s,
            space_left: job.sources[s].length,
            cut_indices: [],
        };
    },


    //main working variable
    //array mapping cuts of wood onto their parent sources (links[cut_index] = source_index)
    links:[],


    run:function(job) {

    },

    //WARNING: recursive
    choose_source: function(job) {
        if(cuts_left(job) > 0)
        {
            //loop through every length (type) of source material
            job.sources.forEach(function(source, s) {
                if(source.quantity == 0) return; //skip spent sources

                fill_source(job, source.length, []);

            });
        }
        else
        {
            //solution has been reached
        }
    },

    //WARNING: recursive
    //tries to make another cut
    fill_source: function(job, board) {
        if((space_left > 0) && (cuts_left(job) > 0))
        {
            //loop through every length (type) of cut still available
            job.cuts.forEach(function(cut, c) {

                if(cut.quantity == 0)
                    return; //skip spent cut sizes

                //if this cut size is too long for the remaining space
                if(board.space_left < cut.length)
                    return; //skip

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
                full_solve.fill_source(job, board);

                //undo the cut
                board.space_left = old_space_left;
                board.cut_indices.pop()
                cut.quantity++;
            });
        }
        else
        {
            //board has been filled
            report_links();
        }
    },

};









var full_solve = {

    //running vars
    sources:undefined,
    segments:undefined,
    used:undefined, //array mapping segments onto sources (used[segmentindex] = sourceIndex)
    kerf:undefined,

    //best state
    best_used:undefined,
    best_loss:undefined,     //lower = better
    best_clumping:undefined, //higher = better
    totalLoss:undefined,


    run:function(_sources, _segments, _kerf)
    {
        sources = _sources;
        segments = _segments;
        used = new Array();
        kerf = _kerf;

        best_used = undefined;
        best_loss = undefined;
        best_clumping = undefined;

        //get this party started
        this.solve(segments.length - 1);
        
        totalLoss = best_loss;

        return best_used;
    },


    /*
        WARNING: Recursive
        n = segment index
        each call adds a piece
    */
    solve:function(n)
    {
        if(n >= 0) //process this piece
        {
            var segment = segments[n];
            var prevStates = new Array();

            for(var i = 0; i < sources.length; i++)
            {
                var source = sources[i];
                var state = {length:source.length, numSegs:source.numSegs, segLength:source.segLength};

                if(!this.inArray(state, prevStates)) //reject states that are similar to those tested before (speeds it up considerably)
                {
                    prevStates.push(state);

                    //if there's space for the segment in this source
                    if(this.remainingSpace(i) >= segment.length)
                    {
                        //place the piece
                        source.segLength += segment.length;
                        source.numSegs++;
                        used[n] = i;
                        this.solve(n - 1); //process the next piece
                        used[n] = -1;
                        source.numSegs--;
                        source.segLength -= segment.length;
                        //If you're reading this and you have ideas, feel free to email bcw7044@rit.edu; I like making things better
                    }
                }
            }
        }
        else //solution has been reached
        {
            var loss = this.totalLoss();
            var clumping = this.totalClumping();

            //test if this arrangment is better than the previous
            //if((best_loss === undefined) || (loss < best_loss))
            if((best_loss === undefined) || ((loss <= best_loss) && (clumping > best_clumping)))
            {
                best_loss = loss;
                best_used = used.slice(0);
                best_clumping = clumping;
            }
        }
    },

    //returns the amount of remaining space on all of the used sources
    totalLoss:function()
    {
        var loss = 0;

        for(var i = 0; i < sources.length; i++)
        {
            var source = sources[i];
            if(source.numSegs > 0)
            {
                loss += this.remainingSpace(i);
            }
        }
        return loss;
    },

    //tries to centralize the loss (recursive method WILL minimize loss, but the distributions can be a bit obnoxious)
    totalClumping:function()
    {
        var clumping = 0;
        var averageLoss = this.totalLoss();
        var numSources = 0;

        for(var i = 0; i < sources.length; i++)
        {
            var source = sources[i];
            if(source.numSegs > 0)
            {
                numSources++;
            }
        }

        averageLoss /= numSources;

        for(var i = 0; i < sources.length; i++)
        {
            var source = sources[i];
            if(source.numSegs > 0)
            {
                clumping += Math.abs(averageLoss - source.segLength);
            }
        }

        return clumping;
    },

    //calculates the remaining space on a given source
    //kerf for next piece is included
    remainingSpace:function(n)
    {
        var s = sources[n];
        //var rem = s.length - (s.segLength + ((s.numSegs - 1) * kerf));

        //if(rem != 0)
        //{
            rem = s.length - (s.segLength + (s.numSegs * kerf));
        //}

        return rem;
    },

    //used for testing against previous conditions
    inArray:function(value, array)
    {
        for(var i = 0; i < array.length; i++)
        {
            if((array[i].length === value.length) &&
               (array[i].numSegs === value.numSegs) &&
               (array[i].segLength === value.segLength))
            {
                return true;
            }
        }
        return false;
    }
};