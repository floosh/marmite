const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('marmiton.db');
const fs = require('fs');

function ingredientsFromRecipes(recipes) {
	return recipes.reduce(function(acc, recipe, index) {
		recipe.ingredients.forEach(function(ingredient) {
			if (!acc[ingredient.name]) {
				acc[ingredient.name] = [];
			}
			if (acc[ingredient.name].indexOf(index) == -1) {
				acc[ingredient.name].push(index);
			}
		});
		return acc;
	}, {});
}

db.all("Select * from recipes", [], function(err, recipes) {

	for (var i = 0; i < recipes.length; i++){
		if(recipes[i]) {
			recipes[i].ingredients = [];
			for (var j = i+1; j < recipes.length; j++){
				if(recipes[j]) {
					if(recipes[i].link == recipes[j].link) {
						console.log(i, recipes[j].link);
						delete recipes[j];
					}
				}
			}
		}
	}

	db.all("Select * from ingredients", [], function(err, ingredients) {

		for (var i = 0; i < ingredients.length; i++){
			if (recipes[ingredients[i].recipe]) {
				recipes[ingredients[i].recipe].ingredients.push(ingredients[i]);
			}
		}

		recipes = recipes.filter(function (e) {
			return e != null;
		});

	 	fs.writeFile('recipes.json', JSON.stringify(recipes), (err) => {
			if (err) throw err;
	 		console.log('Recipes - done');
		 });

		fs.writeFile('ingredients.json', JSON.stringify(ingredientsFromRecipes(recipes)), (err) => {
			if (err) throw err;
	 		console.log('Ingredients - done');
		 });
	})
})