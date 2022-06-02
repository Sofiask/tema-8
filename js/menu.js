//Gets burger element and is outside of main so that all functions has access to it. 
const burgerElement = document.querySelector("#burgerElement")

//Gets all element from html
export function main(){
    //gets hide button that will hide burger menu
    const hideButton = document.querySelector("#hideButton")
    //gets show button that will show burger menu
    const showButton = document.querySelector("#showButton")

    //adds a click event to showbutton, at click invoke showBurger function
    showButton.addEventListener("click", showBurger)
    //adds a click event to hidebutton, at click invoke hideBurger function
    hideButton.addEventListener("click", hideBurger)
}

// invoke main
// main();

//Function to show burger
function showBurger(){
    //removes hidden class 
    burgerElement.classList.remove("hidden");
    //gets animations from css and applies it to burgermenu, applies animation to show burgerelement
    burgerElement.style.animation = "easeIn 0.35s ease-in-out";
}

// function to hide burgermenu
function hideBurger(){
    //add hidden class
    burgerElement.classList.add("hidden");
    // gets animations from css and to burgermenu, applies animation to hide burgerelement
    burgerElement.style.animation = "easeOut 0.35s ease-in-out";

}

