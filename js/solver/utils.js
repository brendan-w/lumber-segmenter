
//returns the number of cuts left to make on a job
function cuts_left(job) {
    var total = 0;
    for(var i = 0; i < job.cuts.length)
        total += job.cuts[i].quantity;
    return total;
}
