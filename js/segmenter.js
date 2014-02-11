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


var segmenter = {

	run:function(sources, sources_unlim, segments, settings)
	{
		var mode = settings.mode;
		var kerf = settings.kerf;
		var compiledSources = new Array();


		//add the limited sources
		for(var i = 0; i < sources.length; i++)
		{
			compiledSources.push(this.makeSource(sources[i].length));
		}

		//add one of each unlimited
		for(var i = 0; i < sources_unlim.length; i++)
		{
			compiledSources.push(this.makeSource(sources_unlim[i].length));
		}


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
			case 0: //Auto

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

			case 1:
				used = solve.run(compiledSources, segments, kerf); //Optimal
				break;

			case 2:
				used = fast_solve_1.run(compiledSources, segments, kerf); //Sub-Optimal 1
				break;

			case 3:
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

	makeSource:function(l)
	{
		return {length:l, numSegs:0, segLength:0}; //the working object of the solvers
	},

	makeResult:function(_success, _data)
	{
		return {success:_success, data:_data};
	}
};