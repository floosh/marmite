const jsdom = require("jsdom");
const {
    JSDOM
} = jsdom;
const request = require('request');
let recipes = require('./links.json');
const fs = require('fs');

var url_marmiton = "https://www.marmiton.org";

function parseHTML(html) {
    return new JSDOM(html).window.document;
}

function get(url) {
    return new Promise(function (resolve, reject) {
        request(url, function (error, response, body) {
            if (response.statusCode < 400) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    })
}


// Load recipes links

/*
async function loadRecipesLinks(dish, n) {
    let response = await request.get(url_marmiton + dish + "&page=" + n);
    let doc = parseHTML(response);
    return Array.map(doc.getElementsByClassName("recipe-card"), function(elem) {
        return elem.getElementsByTagName("a")[0].getAttribute("href");
    });
}

async function loadAllRecipesLinks(dish) {
    let n = 1;
    let recipes = []
    do {
        var new_recipes = await loadRecipesLinks(dish, n);
        recipes.push(...new_recipes);
        n++;
    } while (new_recipes.length > 0);
    return recipes;
}

loadPage(url_marmiton + "/recettes/").then(function(response, error) {
    let doc = parser.parseFromString(response, "text/html");
    let dishs = Array.map(doc.getElementsByClassName("recipe-flex-nav")[1].children[0].children, function(li) {
        return li.getElementsByTagName("a")[0].getAttribute("href")
    });
    console.log(dishs);
    Promise.all(Array.map(dishs, function(dish) {
        return loadAllRecipesLinks(dish);
    })).then(function(recipes) {
        console.log("Done");
        recipes = recipes.flat();
        console.log(recipes);
        console.log(JSON.stringify(recipes));
    });
});
*/

function parseIngredients(url) {
    return get(url).then(function (body) {
        let doc = parseHTML(body);
        let ingredients = Array.from(doc.querySelectorAll(".recipe-ingredients__list__item")).map(function (item) {
            return {
                i: item.querySelector(".name_singular").getAttribute("data-name-singular"),
                q: item.querySelector(".recipe-ingredient-qt").getAttribute("data-base-qt")
            }
        });
        return {
            recipe: url,
            ingredients: ingredients
        }
    }).catch(err => console.log(err));
}

var wstream = fs.createWriteStream('recipes.json');

wstream.write("[");

async function loadAllRecipes() {
    let nb_recipes_to_load = recipes.length;
    for (var i = 0; i < nb_recipes_to_load; i++) {
        let ingredients = await parseIngredients(recipes[i]);
        wstream.write(JSON.stringify(ingredients) + ((i == nb_recipes_to_load - 1) ? "" : ","));
        if (i % 10 == 0) {
            console.log(i)
        }
    }
}

loadAllRecipes().then(function () {
    wstream.write("]");
    wstream.end();
    console.log("done");
})