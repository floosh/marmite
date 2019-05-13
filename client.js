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

function recipeScore(recipe) {
	return recipe.comments * recipe.rating;
}

var HTMLTemplates = {};
var data = {};
var context = {
	filters: [],
	lastId: 0
};

$(document).ready(function () {

	setLoading(true);

	// Loading dataset
    getJson('./recipes.json').then(function (recipes) {

		data.recipes = recipes.map(function(recipe) {
			recipe.ratingPercent = recipe.rating*20;
			return recipe;
		}).sort(function(r1, r2) {
			return recipeScore(r2) > recipeScore(r1);
		});

		// Create ingredients structure
		data.ingredients = ingredientsFromRecipes(data.recipes);

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
		})

		$(document).on('click', ".filter-delete" , function() {
			removeFilter($(this).attr("filter-name"));
		});

		// Infinite scroll
		$('.col2').scroll(function(){
			if  ($('.col2').scrollTop() >= $("#recipes").height() - $('.col2').height()){
				loadRecipes(false);
			}
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

function setLoading(loading) {
	loading ? $("#loader").show() : $("#loader").hide();
// 	//$("#loader").children().text((percent || 0) + "%");
// 	// $("#test").text(percent);
// 	// $("#test").html(percent);
// 	document.getElementById("test").textContent = percent + " ";
// 	console.log(percent);
}

function loadRecipes(clear) {
	let itemsPerPage = 20;
	let html = Mustache.render(HTMLTemplates["template-recipes"], {recipes: context.recipes.slice(context.lastId, context.lastId + itemsPerPage)});
	if (clear) {
		$("#recipes").html(html);
	} else {
		$("#recipes").append(html);
	}
	context.lastId += itemsPerPage;
}

function update() {

	setLoading(true);

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

	context.lastId = 0;
	updateView();

	setLoading(false);
}


function updateView() {

	loadRecipes(true);
	$("#filters").html(Mustache.render(HTMLTemplates["template-filters"], {filters: context.filters}));
	$("#counter").html(context.recipes.length + " recettes");


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
			},
			color: "#f47321"
		}]
	});
}