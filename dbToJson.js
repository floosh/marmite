const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('marmiton.db');
const fs = require('fs');

function getIngredients(recipe_id) {
    return new Promise(function (resolve, reject) {
		db.all("Select * from ingredients where recipe=(?)", [recipe_id], function(err, ingredients) {
			if (err) {
				reject(err);
			}
			resolve(ingredients.map(function(ingredient) {
				delete ingredient.recipe;
				return ingredient;
			}));
		})
	})
}

db.all("Select * from recipes", [], function(err, recipes) {
	Promise.all(recipes.map(r => getIngredients(r.id))).then(function(ingredients) {
		for(var i = 0; i<recipes.length; i++) {
			recipes[i].ingredients = ingredients[i];
		}

		fs.writeFile('recipes.json', JSON.stringify(recipes), (err) => {
			if (err) throw err;
			console.log('Done');
		});

	});
})
