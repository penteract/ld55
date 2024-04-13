import random
random.seed(100)

suffixes = ["x","v","z","th","ch","k","n","w"]
prefixes = ["gr","q","","d","tr","g","dr","n","hr","r"]
vowels = ["u","o","i","a","e"]#"ø" looks cool, but lets not introduce unicode issues
def fromListRand(l):
    n = len(l)
    j=sum(1/(i+3) for i in range(n))
    k = random.random()*j
    i=0
    for i in range(n):
        k-=1/(i+3)
        if(k<0):
            break
    return l[i-1]

def randname():
    name=""
    while (random.random()<(1-0.085*len(name))):
        name+=fromListRand(prefixes)+fromListRand(vowels)+fromListRand(suffixes)
    return name
