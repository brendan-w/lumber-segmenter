/*
 *  Brendan Whitfield (C) 2014
 *  
 *  This file acts as a driver for the various solvers.
 *  Since the solvers work on discrete input, unlimited sources are handled here.
 *  
 *  Segments = desired cuts of wood (WANT)
 *  Sources = known quatity stock (HAVE)
 *  Sources_unlim = unlimited quatity stock (HAVE)
 */


function descending_length(a, b) { return b.length - a.length; }

function run(job)
{

    //Having the solvers allocate the bigger cuts first will cause
    //boards to fill up faster, which rapidly disqualifies choices,
    //and helps speed the process along. This way, you won't waste
    //time piling on a bunch of small pieces, only to find that you
    //have no room for your big pieces.
    job.sources.sort(descending_length);
    job.cuts.sort(descending_length);


    //TODO: resolve quantities of Infinity to actual counts

    var layout = null;

    switch(job.settings.mode)
    {
        default:
        case "auto": //Auto
            //TODO
            break;

        case "solve":
            layout = full_solve.run(job);
            break;

        case "fast_1":
            //TODO
            break;

        case "fast_2":
            //TODO
            break;
    }

    if(layout)
        return { success:true, data:convert_structure_patch(job, layout) };
    else
        return { success:false, data:"failed to compute layout" };
}


/*
    A dirty hack to adapt this to the UI
    TODO: don't make dirty hacks
*/
function convert_structure_patch(job, layout)
{
    var output = [];
    layout.forEach(function(board) {

        var output_board = {
            length: job.sources[board.source_index].length,
            segLength: 0,
            segments: [],
        };

        board.cut_indices.forEach(function(c) {
            var cut = job.cuts[c];
            
            output_board.segments.push({
                length: cut.length,
                color: cut.color,
            });
        });

        output.push(output_board);
    });

    return output;
}









var segmenter = {

    run:function(mode, kerf, sources, sources_unlim, segments)
    {
        var compiledSources = [];

        //add the limited sources
        for(var i = 0; i < sources.length; i++)
            compiledSources.push(this.makeSource(sources[i].length));

        //add one of each unlimited
        for(var i = 0; i < sources_unlim.length; i++)
            compiledSources.push(this.makeSource(sources_unlim[i].length));


        //pre-flight checks
        var check = this.test(compiledSources, segments);

        if(check.tooBig)
        {
            //error
            return this.makeResult(false, "One of your desired cuts is too big for any of your stock");
        }
        else if(sources_unlim.length === 0)
        {
            if(check.tooMuch)
            {
                return this.makeResult(false, "You don't have enough wood for that :(");
            }
        }
        else
        {
            //add enough to cover the rest AND the expected losses
            for(var i = 0; i < sources_unlim.length; i++)
            {
                var length = sources_unlim[i].length;
                var num = Math.ceil(check.maxLoss / length);

                if(check.tooMuch)
                {
                    num += Math.ceil(check.howMuchMore / length);
                }

                for(var q = 0; q < num; q++)
                {
                    compiledSources.push(this.makeSource(length));
                }
            }
        }


        //sort everything large to small
        compiledSources.sort(function(a,b){return b.length-a.length});
        segments.sort(function(a,b){return b.length-a.length});


        //run the solver for the mode
        var used = undefined;
        switch(mode)
        {
            default:
            case "auto": //Auto

                if((sources.length + sources_unlim.length) * segments.length < 35) //rough estimate of how bad this is going to be //80
                {
                    used = solve.run(compiledSources, segments, kerf); //Optimal
                }
                else
                {
                    //Sub-Optimal 1
                    var fast1 = fast_solve_1.run(compiledSources, segments, kerf);
                    var loss1 = fast_solve_1.totalLoss;

                    //Sub-Optimal 2
                    var fast2 = fast_solve_2.run(compiledSources, segments, kerf);
                    var loss2 = fast_solve_2.totalLoss;

                    if(loss1 <= loss2)
                    {
                        used = fast1;
                    }
                    else
                    {
                        used = fast2;
                    }
                }
                break;

            case "solve":
                used = solve.run(compiledSources, segments, kerf); //Optimal
                break;

            case "fast_1":
                used = fast_solve_1.run(compiledSources, segments, kerf); //Sub-Optimal 1
                break;

            case "fast_2":
                used = fast_solve_2.run(compiledSources, segments, kerf); //Sub-Optimal 2
                break;
        }
        
        if((used === undefined) || (used.length === 0))
        {
            //error
            return this.makeResult(false, "Can't do it :(");
        }
        else
        {
            //return the formatted results
            var results = this.compileResults(compiledSources, segments, used);
            return this.makeResult(true, results);
        }
    },


    compileResults:function(compiledSources, segments, used)
    {
        var results = new Array(); //array of sources (with an array for the composing segments)

        //init the results array
        for(var i = 0; i < compiledSources.length; i++)
        {
            results[i] = {length:compiledSources[i].length, segments:new Array(), segLength:0};
        }

        //attach segments to their respective sources based on used[]
        for(var i = 0; i < used.length; i++)
        {
            var result = results[used[i]];
            result.segments.push(segments[i]);
            result.segLength += segments[i].length;
        }

        //ditch sources that weren't used
        for(var i = 0; i < results.length; i++)
        {
            if(results[i].segments.length == 0)
            {
                results.splice(i, 1);
                i--;
            }
        }

        //sort by the total length of used wood
        results.sort(function(a,b){return b.segLength-a.segLength});

        return results;
    },


    test:function(compiledSources, segments)
    {
        var largestSource = 0;
        var largestSegment = 0;
        var averageSegment = 0;
        var totalSource = 0;
        var totalSegment = 0;

        for(var i = 0; i < compiledSources.length; i++)
        {
            var l = compiledSources[i].length;
            totalSource += l;
            if(l > largestSource)
            {
                largestSource = l;
            }
        }

        for(var i = 0; i < segments.length; i++)
        {
            var l = segments[i].length;
            totalSegment += l;

            if(l > largestSegment)
            {
                largestSegment = l;
            }
        }

        averageSegment = totalSegment / segments.length;

        return {tooBig:(largestSegment > largestSource),
                tooMuch:(totalSegment > totalSource),
                howMuchMore:(totalSegment - totalSource),
                maxLoss:(largestSource - averageSegment) * segments.length};
    },

    //the working object of the solvers
    makeSource:function(l)
    {
        return {
            length: l,
            numSegs: 0,
            segLength:0
        };
    },

    makeResult:function(_success, _data)
    {
        return {
            success: _success,
            data:_data
        };
    }
};



onmessage = function(e) {
    //all messages start a new cut job
    console.log("Job Started", e.data);
    postMessage(run(e.data));
};
