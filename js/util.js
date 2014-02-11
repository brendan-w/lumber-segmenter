/*
 *  Brendan Whitfield (C) 2014
 *  
 *  A place for the handy things.
 */

//returns a moderately different color for as long as it can
function colorForIndex(n)
{
	var val = n * 282;
	val = mod(val, 360);
	return {'background-color':'hsl(' + val.toString() + ', 100%, 65%)'};
}

//get the index of a <select> box
function selectIndex($select)
{
	var text = $select.val();
	var $options = $select.find("option");
	for(var i = 0; i < $options.length; i++)
	{
		if($options[i].innerHTML === text)
		{
			return i;
		}
	}
	return -1;
}

//parses strings with fractional components into floats
function parseNumber(str)
{
	var number = parseFloat(str);
	if(!isNaN(number)) //if it's valid
	{
		str.replace("and", " ");
		str.replace("+", " ");
		str.replace("-", " ");
		str.replace(",", " ");
		str.replace("(", " ");
		str.replace(")", " ");

		var compound = str.indexOf("/");

		if(compound != -1)
		{
			var start = str.lastIndexOf(" ", compound);
			var numer;
			var denom = str.substring(compound + 1, str.length);

			if(start != -1)
			{
				numer = str.substring(start + 1, compound);
			}
			else
			{
				numer = str.substring(0, compound);
				number = 0;
			}

			var r = parseFloat(numer) / parseFloat(denom);
			if(!isNaN(r)) { number += r; }
		}
	}
	return number;
}


//fix Javascript modulo bug for negative numbers
function mod(x,n) {return(((x%n)+n)%n);}