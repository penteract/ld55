suffixes = ["x","v","z","th","ch","k","n"]
prefixes = ["gr","q","","d","tr","g","dr","n","r","hr"]
vowels = ["u","o","i","a","e"]
function fromListRand(l){
    n = l.length
    j=0
    for(i=1;i<=n;i++){j+=1/(i+2)}
    k = Math.random()*j //(Math.log(n)+0.5)

    for(i=1;i<n;i++){
        k-=1/(i+2)
        if(k<0)break;
    }
    return l[i-1]
}

function randname(){
    name=""
    do{
        name+=fromListRand(prefixes)+fromListRand(vowels)+fromListRand(suffixes)
    }while (Math.random()<(1-0.085*name.length))
    return name
}
