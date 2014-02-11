/*
 *  Brendan Whitfield (C) 2014
 *  
 *  Solves for a SUB-OPTIMAL cut pattern.
 *  sources are filled one board at a time.
 *  boards are filled with segments sorted from large to small until no further segments fit
 *  
 *  Segments = desired cuts of wood (WANT)
 *  Sources = stock to be cut (HAVE)
 */


var fast_solve_1 = {

	//running vars
	sources:undefined,
	segments:undefined,
	used:undefined, //array mapping segments onto sources (used[segmentindex] = sourceIndex)
	kerf:undefined,
	totalLoss:undefined,

	//arrays of materials, organized by length
	sourceTypes:undefined,
	segmentTypes:undefined,


	run:function(_sources, _segments, _kerf)
	{
		sources = _sources;
		segments = _segments;
		used = new Array();
		kerf = _kerf;

		sourceTypes = this.compileTypes(sources);
		segmentTypes = this.compileTypes(segments);

		this.totalLoss = 0;

		//run
		this.solve();

		return used;
	},


	
	solve:function()
	{
		//while there's still material left to allocate
		while(this.areMore(segmentTypes) && this.areMore(sourceTypes))
		{
			var best_loss = undefined;
			var best_pattern = undefined; //array of segment type indexes
			var best_source = undefined; //source type index

			//loop through the sources, find the source that creates the least loss pattern
			for(var i = 0; i < sourceTypes.length; i++)
			{
				var source = sourceTypes[i];

				if(source.indices.length != 0)
				{
					//find the least loss arrangement for this source
					var layout = this.fillPieces(source.length);

					//log the best solution
					if((best_loss === undefined) || (layout.loss < best_loss))
					{
						best_loss = layout.loss;
						best_pattern = layout.pattern;
						best_source = i;
					}
				}
			}

			//next move has been determined, apply the changes
			this.totalLoss += best_loss;
			var sourceId = sourceTypes[best_source].indices.pop();
			for(var i = 0; i < best_pattern.length; i++)
			{
				var segmentId = segmentTypes[best_pattern[i]].indices.pop();
				used[segmentId] = sourceId;
			}
		}

		if(!this.areMore(sourceTypes) && this.areMore(segmentTypes))
		{
			//sources ran out first
			used = undefined;
		}
	},


	/*
		remLength = remaining space on a single board
	*/
	fillPieces:function(remLength)
	{
		var typeArray = new Array();

		//loop through the various segment lengths
		for(var i = 0; i < segmentTypes.length; i++)
		{
			var seg = segmentTypes[i];
			var indices = seg.indices.slice(0); //copy the indices. don't want to go deleting the real ones yet

			while((indices.length != 0) && (remLength >= seg.length))
			{
				//add the piece
				typeArray.push(i);
				indices.pop();
				remLength -= (seg.length + kerf);
			}
		}

		return {loss:remLength, pattern:typeArray};
	},

	//returns true if there are still indices left to be used
	areMore:function(array)
	{
		for(var i = 0; i < array.length; i++)
		{
			var item = array[i];
			if(item.indices.length > 0)
			{
				return true;
			}
		}

		return false;
	},

	//function for grouping pieces by length, with an array of original indices
	compileTypes:function(array)
	{
		var result = new Array();

		for(var i = 0; i < array.length; i++)
		{
			var item = array[i];
			var pos = this.inArray(item, result);
			if(pos === -1)
			{
				var obj = {length:item.length, indices:new Array()};
				obj.indices.push(i);
				result.push(obj);
			}
			else
			{
				result[pos].indices.push(i);
			}
		}

		return result;
	},

	//returns the index of a matching .length property
	inArray:function(value, array)
	{
		for(var i = 0; i < array.length; i++)
		{
			if(array[i].length === value.length)
			{
				return i;
			}
		}
		return -1;
	}
};