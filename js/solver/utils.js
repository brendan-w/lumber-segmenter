

//returns the number of cuts left to make on a job
//will return Infinity if one or more sources are unlimited
function sources_left(job) {
    var total = 0;
    for(var i = 0; i < job.sources.length)
        total += job.sources[i].quantity;
    return total;
}


//returns the number of cuts left to make on a job
function cuts_left(job) {
    var total = 0;
    for(var i = 0; i < job.cuts.length)
        total += job.cuts[i].quantity;
    return total;
}
