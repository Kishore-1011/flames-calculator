function fun(s, count) {
    let n = s.length;
    if (n <= 1) {
        return s;
    } else {
        let x = count % n;
        if (x === 0) {
            s = s.substring(0, n - 1);
        } else {
            s = s.substring(x) + s.substring(0, x - 1);
        }
    }
    return fun(s, count);
}

function display(ans) {
    if (ans === "F") {
        return "Friends";
    } else if (ans === "L") {
        return "Love";
    } else if (ans === "A") {
        return "Affection";
    } else if (ans === "M") {
        return "Marriage";
    } else if (ans === "E") {
        return "Enemy";
    } else if (ans === "S") {
        return "Sister";
    } else{
        return ans;
    }
}
function Myfunction(){
    let s1 = document.getElementById("n1").value;
    let s2 = document.getElementById("n2").value;
    s1 = s1.toLowerCase()
    s2 = s2.toLowerCase()
    s1 = s1.replace(/\s/g, '');
    s2 = s2.replace(/\s/g, '');
    let count = 0;
    let s = "FLAMES";
    let ans = "";
    if(s1.length == 0 || s2.length == 0){
        ans = "Please The Enter Name";
    }
    else{
        for (let i = 0; i < s1.length; i++) {
            if (s2.indexOf(s1[i]) === -1) {
                count++;
            } else {
                s2 = s2.replace(s1[i], "");
            }
        }
        count += s2.length;
        ans = fun(s, count);
    }
    document.getElementById("ans").innerHTML = display(ans);
}
