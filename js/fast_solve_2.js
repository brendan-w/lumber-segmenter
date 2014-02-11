/*
 *  Brendan Whitfield (C) 2014
 *  
 *  Solves for a SUB-OPTIMAL cut pattern.
 *  sources are filled one board at a time, minimizing loss on a per-board basis
 *  boards are filled with any combination of segments
 *  
 *  Segments = desired cuts of wood (WANT)
 *  Sources = stock to be cut (HAVE)
 */


var fast_solve_2 = {

	//running vars
	sources:undefined,
	segments:undefined,
	used:undefined, //array mapping segments onto sources (used[segmentindex] = sourceIndex)
	kerf:undefined,
	totalLoss:undefined,

	//arrays of materials, organized by length
	sourceTypes:undefined,
	segmentTypes:undefined,

	//place for the recursive function to store its best results
	r_best_loss:undefined,
	r_best_pattern:undefined,

	run:function(_sources, _segments, _kerf)
	{
		sources = _sources;
		segments = _segments;
		used = new Array();
		kerf = _kerf;
		
		this.totalLoss = 0;

		sourceTypes = this.compileTypes(sources);
		segmentTypes = this.compileTypes(segments);

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
					r_best_loss = undefined;
					r_best_pattern = undefined;

					this.addPiece(source.length, new Array());

					//log the best solution
					if((best_loss === undefined) || (r_best_loss < best_loss))
					{
						best_loss = r_best_loss;
						best_pattern = r_best_pattern;
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
		WARNING: Recursive
		remLength = remaining space on a single board
		each call adds a piece
		when a board is filled, it's loss is tested, and it is stored in r_best_loss and r_best_pattern
	*/
	addPiece:function(remLength, typeArray)
	{
		var pieceFit = false;

		if(remLength > kerf)
		{
			//loop through the various segment lengths
			for(var i = 0; i < segmentTypes.length; i++)
			{
				var seg = segmentTypes[i];

				if(seg.indices.length != 0)
				{
					if(remLength >= seg.length)
					{
						//add the piece
						pieceFit = true;

						var id = seg.indices.pop();
						typeArray.push(i);
						this.addPiece(remLength - (seg.length + kerf), typeArray);
						typeArray.pop();
						seg.indices.push(id); //put that thing back where it came from or so help meeee!
					}
				}
			}
		}
		else
		{
			//pieceFit = false;
		}

		if(!pieceFit)
		{
			//no more room for pieces, test for least loss
			if((r_best_loss === undefined) || (remLength < r_best_loss))
			{
				r_best_loss = remLength;
				r_best_pattern = typeArray.slice(0);
			}
		}
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