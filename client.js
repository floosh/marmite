function getJson(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.overrideMimeType("application/json");
        xhr.open("GET", url);
        xhr.onload = () => resolve(JSON.parse(xhr.responseText));
        xhr.onerror = () => reject(xhr.statusText);
        xhr.send();
    });
}

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

function uniq(value, index, self) {
    return self.indexOf(value) === index;
}

function ingredientsFromRecipes(recipes) {
	return recipes.reduce(function(acc, recipe, index) {
		recipe.ingredients.forEach(function(ingredient) {
			if (acc[ingredient]) {
				acc[ingredient].includes(index) ? '' : acc[ingredient].push(index);
			} else {
				acc[ingredient] = [index];
			}
		});
		return acc;
	}, {});
}

var HTMLTemplates = {};
var data = {};
var context = {
	filters: []
};

$(document).ready(function () {

	// Loading dataset
    getJson('./10krecipes.json').then(function (recipes) {

		// Clean recipes
        data.recipes = recipes.reduce(function(acc, recipe) {
			if (!acc.find(r => r.url == recipe.url)) {
				acc.push({
					url: recipe.url,
					ingredients: recipe.ingredients.map(ri => (clean(ri.i))).filter(Boolean)
				});
			}
			return acc;
		}, []);

		// Create ingredients structure
        data.ingredients = ingredientsFromRecipes(data.recipes)

		// Load HTML Templates
		$(".mustache-template").each(function() {
			HTMLTemplates[this.id] = this.innerHTML;
			Mustache.parse(this.innerHTML);
		})

		// Init select2 list
		$('#ingredients').select2({
			data: Object.keys(data.ingredients),
			width: '100%'
		});

		// Events
		$('#ingredients').change(function() {
			let ingredient = $("#ingredients").val();
			addFilter(ingredient);
			update(ingredient);
		})

		$(document).on('click', ".filter-delete" , function() {
			removeFilter($(this).attr("filter-name"));
		});

		update();

	})

});

function addFilter(ingredient) {
	if (context.filters.indexOf(ingredient) === -1) {
		context.filters.push(ingredient);
		update();
	}
}

function removeFilter(ingredient) {
	let index = context.filters.indexOf(ingredient);
	if(index > -1) {
		context.filters.splice(index, 1);
		update();
	}
}

function update() {

	// Update context
	if (context.filters.length) {

		// Get all recipes
		let allMatchingRecipes = context.filters.map(function(ingredient) {
			return data.ingredients[ingredient];
		}).reduce(function(acc, recipes) {
			for (let recipe of recipes) {
				acc[recipe] = (acc[recipe] || 0) + 1;
			}
			return acc;
		},{});

		let fullyMatchingRecipes = Object.keys(allMatchingRecipes).filter(r => allMatchingRecipes[r] == context.filters.length);

		context.recipes = fullyMatchingRecipes.map(function(recipeId) {
			return data.recipes[recipeId];
		});

		context.ingredients = ingredientsFromRecipes(context.recipes);

	} else {
		context.recipes = data.recipes;
		context.ingredients = data.ingredients;
	}

	// Show filters

	if (context.filters) {
		$("#filters").html(Mustache.render(HTMLTemplates["template-filters"], {filters: context.filters}));
	}

	$("#recipes").html(context.recipes.map(r => r.url).join('<br/>'));

	let highchartData = Object.entries(context.ingredients).map(function(ingredient) {
		return [ingredient[0], ingredient[1].length]
	}).sort(function(a, b) {
		return (b[1] - a[1])
	}).slice(0,25);

	Highcharts.chart('graph', {
		chart: {
			type: 'bar',
			marginTop: 40,
			marginBottom: 40,
			height: highchartData.length*25 + 80
		},
		title: {
			text: 'Most used ingredients'
		},
		xAxis: {
			type: 'category',
			labels: {
				style: {
					fontSize: '13px',
					fontFamily: 'Verdana, sans-serif'
				}
			}
		},
		yAxis: {
			min: 0,
			title: {
				text: 'Utilisations'
			}
		},
		legend: {
			enabled: false
		},
		tooltip: {
			pointFormat: '{point.y} Utilisations'
		},
		plotOptions: {
			series: {
				pointWidth:20
			}
		},
		series: [{
			name: 'Ingredients',
			data: highchartData,
			events: {
				click: function(e) {
					addFilter(e.point.name);
				}
			}
		}]
	});

}
