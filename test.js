const jsdom = require("jsdom");
const {
    JSDOM
} = jsdom;
const request = require('request');
const recipes = require('./links.json');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

//fs.unlinkSync('marmiton.db');
const db = new sqlite3.Database('marmiton.db');

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

var cleaners = [
    /^\d+ /,
    /^très /,
    /^petite /,
    /^petit /,
    /^fine /,
    /^grosse /,
    /^gros /,
    /^grande /,
    /^grand /,
    /^demi /,
    /^bonne /,
    /^belle /,
    /^beau /,
    /^g de /,
    /^g d'/,
    /^l de /,
    /^l d'/,
    /^cl de /,
    /^cl d'/,
    /^kg de /,
    /^kg d'/,
    /^ml de /,
    /^ml d'/,
    /^dl de /,
    /^dl d'/,
    /^poignée de /,
    /^poignée d'/,
    /^dose de /,
    /^dose d'/,
    /^cuillère à soupe de /,
    /^cuillère à soupe d'/,
    /^cuillère à café de /,
    /^cuillère à café d'/,
    /^cuillère à soupe rase de /,
    /^cuillère à soupe rase d'/,
    /^cuillère à café rase de /,
    /^cuillère à café rase d'/,
    /^cuillère de /,
    /^cuillère d'/,
    /^bol de /,
    /^bol d'/,
    /^pot de /,
    /^pot d'/,
    /^pincée de /,
    /^pincée d'/,
    /^morceau de /,
    /^morceau d'/,
    /^tranche de /,
    /^tranche d'/,
    /^tranche épaisse de /,
    /^tranche épaisse d'/,
    /^tranche fine de /,
    /^tranche fine d'/,
    /^boule de /,
    /^boule d'/,
    /^boite de /,
    /^boite d'/,
    /^boîte de /,
    /^boîte d'/,
    /^sachet de /,
    /^sachet d'/,
    /^paquet de /,
    /^paquet d'/,
    /^brin de /,
    /^brin d'/,
    /^branchette de /,
    /^branchette d'/,
    /^branche de /,
    /^branche d'/,
    /^filet de /,
    /^filet d'/,
    /^tablette de /,
    /^tablette d'/,
    /^demi de /,
    /^demi d'/,
    /^barquette de /,
    /^barquette d'/,
    /^bouquet de /,
    /^bouquet d'/,
    /^verre de /,
    /^verre d'/,
    /^feuille de /,
    /^feuille d'/,
    /^botte de /,
    /^botte d'/,
    /^centimètre de /,
    /^centimètre d'/,
    /^bocal de /,
    /^bocal d'/,
    /^moitié de /,
    /^moitié d'/,
    /^moitiée de /,
    /^moitiée d'/,
    /^portion de /,
    /^portion d'/,
    /^grain de /,
    /^grain d'/,
    /^tasse de /,
    /^tasse d'/,
    /^tasse à café de /,
    /^trait de /,
    /^trait d'/,
    /^pointe de /,
    /^pointe d'/,
    /^morceaux de /,
    /^morceaux d'/,
    /^rondelle de /,
    /^rondelle d'/,
    /^bloc de /,
    /^bloc d'/,
    /^lamelle de /,
    /^lamelle d'/,
    /^plaque de /,
    /^plaque d'/,
    /^goutte de /,
    /^goutte d'/,
    /^carré de /,
    /^carré d'/,
    /^quartier de /,
    /^quartier d'/,
    /^reste de /,
    /^reste d'/,
    /^bouteille de /,
    /^bouteille d'/,
    /^briquette de /,
    /^briquette d'/,
    /^cube de /,
    /^cube d'/,
    /^louche de /,
    /^louche d'/,
    /^touffe de /,
    /^touffe d'/,
    /^saladier de /,
    /^saladier d'/,
    /^pavé d'/,
    /^pavé de /,
    /^livre de /,
	/^livre d'/,
    /^de /,
    /^d'/,
]

function clean(ingredient, calltwice = true) {
    ingredient = ingredient.replace(/\s+/g, " ").trim();
    cleaners.forEach(function (cleaner) {
        ingredient = ingredient.replace(cleaner, '');
    });
    return (calltwice ? clean(ingredient, false) : ingredient);
}


function parseRecipe(url) {
    return get(url).then(function (body) {
        let doc = parseHTML(body);
        let ingredients = Array.from(doc.querySelectorAll(".recipe-ingredients__list__item")).map(function (item) {
            return {
                name: item.querySelector(".name_singular").getAttribute("data-name-singular"),
                quantity: item.querySelector(".recipe-ingredient-qt").getAttribute("data-base-qt")
            }
		});
		let img_node = doc.querySelector("#af-diapo-desktop-0_img");
        return {
			link: url,
			title: doc.querySelector(".main-title").innerHTML,
			rating: doc.querySelector(".mrtn-print-only > span").innerHTML,
			comments: doc.querySelector("#post-review-container > .mrtn-hide-on-print").innerHTML.split(' ')[0],
			picture: img_node ? img_node.getAttribute("src") : null,
			ingredients: ingredients
        }
    }).catch(err => console.log(err));
}

// Init DB
// db.serialize(function() {
// 	db.run("CREATE TABLE recipes (id INTEGER PRIMARY KEY, title TEXT, link TEXT, rating REAL, comments INTEGER, picture TEXT)");
// 	db.run("CREATE TABLE ingredients (name TEXT, full_name TEXT, quantity REAL, recipe INTEGER)");
// });


async function loadAllRecipes(lastId) {
	lastId = lastId || -1;
    let nb_recipes_to_load = recipes.length;
	//let nb_recipes_to_load = 50;

    for (var i = lastId+1; i < nb_recipes_to_load; i++) {
		let recipe = await parseRecipe(recipes[i]);

		db.serialize(function() {
			db.run("begin transaction");
			db.run("INSERT INTO recipes VALUES (?, ?, ?, ?, ?, ?)", i, recipe.title, recipe.link, recipe.rating, recipe.comments, recipe.picture);

			recipe.ingredients.forEach(function(ingredient) {
				db.run("INSERT INTO ingredients VALUES (?, ?, ?, ?)", clean(ingredient.name), ingredient.name, ingredient.quantity, i);
			});
			db.run("commit");
		});

        if (i % 10 == 0) {
			console.log(i)
        }
    }
}

db.get("select id from recipes ORDER by id desc limit 1", function(err, row) {
	console.log(row.id);
	console.log(recipes[row.id]);
	loadAllRecipes(row.id).then(function () {
		console.log("done");
	})
})


// var start = Date.now();
// loadAllRecipes().then(function () {
// 	console.log("done");
// 	console.log((Date.now() - start) + "ms");
// })

