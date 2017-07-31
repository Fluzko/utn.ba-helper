var ActasDeFinalesPage = function(utils) {
	
	var KEY_ENTER = 13;
	
	var aprobados = [];
	var desaprobados = [];

	var pesoAcademico;
	var avgAprobados;
	var avgDesaprobados;

	var $helperTable = $("<div style='display:inline-block;'><table><tbody></tbody></table><span class='powered-by-siga-helper'></span></div>");

	var $aprobadosTable = $(".std-canvas table:first");
	var $desaprobadosTable = $(".std-canvas table").length > 1 ? $(".std-canvas table:last") : $();


	var getPonderatedNote = function(note) {
		var newNote = (2 / 3) * (note + 5);
		return Math.round(newNote * 100) / 100; // Only 2 decimals should be used.
	};

	// .. avgs
	var processNoteRow = function($tr, arr) {
		var date = utils.parseDate($tr.find("td:first").text());
		var note = parseInt($tr.find("td:eq(5)").text());
		if (isNaN(note)) return;

		if (date < utils.NEW_NOTES_REGULATION_DATE && note >= 4) {
			note = getPonderatedNote(note);
			$tr.find("td:eq(6)").text(note);
		}
		arr.push(note);
	};

	var getAvgFromArray = function(arr) {
		var sum = arr.reduce(function(a, b) {
			return a + b;
		});
		return Math.round(sum / arr.length * 100) / 100;
	};

	var setAvgs = function() {
		$aprobadosTable.find("tbody tr").each(function() {
			processNoteRow($(this), aprobados);
		});

		$desaprobadosTable.find("tbody tr").each(function() {
			processNoteRow($(this), desaprobados);
		});

		avgDesaprobados = getAvgFromArray(aprobados.concat(desaprobados));
		avgAprobados = getAvgFromArray(aprobados);

		var appendTableRow = function(description, value) {
			$helperTable.find("tbody").append("<tr><td>" + description + "</td><td><b>" + value + "</b></td></tr>");
		};

		appendTableRow("Cantidad de materias aprobadas", aprobados.length);
		appendTableRow("Cantidad de materias desaprobadas", desaprobados.length);
		appendTableRow("Promedio con desaprobados", avgDesaprobados);
		appendTableRow("Promedio sin desaprobados", avgAprobados);
	};
	// ..

	// .. Peso academico
	var setPesoAcademico = function(startYear) {
		var yearsCount = (new Date().getFullYear() - startYear + 1);
		pesoAcademico = 11 * aprobados.length - 5 * yearsCount - 3 * desaprobados.length;

		$helperTable.find(".peso-academico").remove();
		$helperTable.find("tbody").prepend("<tr class='peso-academico'><td>Peso academico</td><td> <b>" + pesoAcademico + "</b> <small>(11*" + aprobados.length + " - 5*" + yearsCount + " - 3*" + desaprobados.length + ")</small> <a class='helper change-year'>Cambiar año de ingreso</a><input class='year-change' type='text' value='" + startYear + "'/></td></tr>");
		bindChangeYear();
	};


	var bindChangeYear = function() {
		$(".std-canvas .change-year").on("click", function() {
			$(this).hide();
			$(this).parent().find(".year-change").show();
		});

		$(".std-canvas .year-change").on("keydown", function(e) {
			if (e.keyCode === KEY_ENTER) {
				var value = $(this).val();
				if (!isNaN(value)) {
					utils.setStartYear(value);
					setPesoAcademico(value);
				}
				e.preventDefault();
				return false;
			}
		});
	};
	// ..

	var postData = function() {
		var timer = setInterval(function() {
			if (avgAprobados && avgDesaprobados && pesoAcademico) {
				clearInterval(timer);
				utils.postData(avgAprobados, avgDesaprobados, pesoAcademico);
			}
		}, 1000);
	};

	var appendTable = function() {
		$(".std-canvas p:first").after($helperTable);
	};

	var addPonderatedColumn = function() {
		$aprobadosTable.find("tr:not(:first)").append("<td></td>");
		$aprobadosTable.find("tr:first").append("<th>Nota ponderada</th>");
	};

	// Init
	(function() {
		appendTable();
		addPonderatedColumn();
		setAvgs();
		utils.getStartYear(setPesoAcademico);

		postData();
	})();
	

	// Public
	return {};
};