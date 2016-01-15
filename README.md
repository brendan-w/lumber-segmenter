Lumber Segmenter
================

http://people.rit.edu/bcw7044/tools/lumber/

Single page application that calculates cuts of lumber and minimizes loss.



Algorithms
==========

Optimal Solution
----------------

Uses a full recursive solver to try every permutation of cuts. Returns solution with least loss.


Suboptimal 1
------------

Considers cuts on one board at a time. The desired output lengths are sorted from largest to smallest, and the computer attempts to make the largest cut first. When there is no more room for a certain cut size, the computer will move on to the next smallest cut. This is repeated until all of the desired cuts have been made.


Suboptimal 2
------------

Recursively minimizes waste on per-board basis. This is essentially a narrower version of the full recursive solver. Also works with the largest boards first.
