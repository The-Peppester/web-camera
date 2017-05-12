$(function() {
	if (window.JpegCamera) {
		var camera; // Initialized at the end

		var update_stream_stats = function(stats) {
			$("#stream_stats").html(
				"Mean luminance = " + stats.mean +
				"; Standard Deviation = " + stats.std);

			//setTimeout(function() {camera.get_stats(update_stream_stats);}, 1000);
		};
		
		var $preview_box = $('#preview')[0],
			$preview_canvas = $('#preview_canvas')[0],
			$preview_cContext = $preview_canvas.getContext("2d"),
			$download_button = $('#download_picture')[0],
			$cancel_button = $('#cancel_download')[0],
			$download_link = $('#download_link')[0];
		
		if (!('filter' in $preview_cContext)){
			var message='You need to upgrade to eithor Chrome/Firefox for this webpage to work!';
			alert(message);
			console.error(message);
		}
		$preview_cContext.textBaseline = 'top'; 
		$preview_cContext.textAlign = 'center'; 
		$preview_canvas.dir = 'rtl';
		$preview_cContext.font = '96px Arizonia';
		
		var take_snapshots = function(count) {
			$preview_canvas.width = camera.video.videoWidth;
			$preview_canvas.height = camera.video.videoHeight;
			$preview_cContext.translate($preview_canvas.width, 0);
			$preview_cContext.scale(-1, 1);
			$preview_cContext.drawImage(camera.video, 0, 0);
			/*$preview_canvas.src = $preview_canvas.toDataURL('image/png');*/
			$preview_box.className = "";
			$download_button.onclick = function(){
				console.log($preview_cContext.filter);
				var petsName = prompt(
					'What is your pets name?\n' + 
					'This text will be put at the bottom of the image. ' + 
					'If you wish for your pet to remain anonymous '+
					'(which it totally fine), then leave this box empty.');
				$preview_cContext.textBaseline = 'top'; 
				$preview_cContext.textAlign = 'center'; 
				$preview_canvas.dir = 'rtl';
				$preview_cContext.font = '96px Arizonia';
				$preview_cContext.fillStyle = "white";
				$preview_cContext.scale(-1, 1);
				$preview_cContext.translate(-$preview_canvas.width, 0);
				if (petsName) $preview_cContext.fillText(petsName.trim(), $preview_canvas.width/2.5, 64);
				$preview_cContext.filter = $preview_canvas.style.filter;
				$preview_cContext.drawImage( $preview_canvas, 0, 0 );
				$preview_cContext.translate($preview_canvas.width, 0);
				$preview_cContext.scale(-1, 1);
				$download_link.href = $preview_canvas.toDataURL('image/png');
				$preview_cContext.filter = '';
				$download_link.click();
				$preview_box.className = "hidden";
				// free up memory & reset:
				$preview_cContext.scale(-1, 1);
				$preview_cContext.translate(-$preview_canvas.width, 0);
				$preview_cContext.clearRect(0, 0, $preview_canvas.width, $preview_canvas.height);
			}
			$cancel_button.onclick = function(){
				$preview_box.className = "hidden";
				// free up memory & reset:
				$preview_cContext.scale(-1, 1);
				$preview_cContext.translate(-$preview_canvas.width, 0);
				$preview_cContext.clearRect(0, 0, $preview_canvas.width, $preview_canvas.height);
			}
			/*if (JpegCamera.canvas_supported()) {
				snapshot.get_canvas(add_snapshot);
			}
			else {
				// <canvas> is not supported in this browser. We'll use anonymous
				// graphic instead.
				var image = document.createElement("img");
				image.src = "no_canvas_photo.jpg";
				setTimeout(function() {add_snapshot.call(snapshot, image)}, 1);
			}

			if (count > 1) {
				setTimeout(function() {take_snapshots(count - 1);}, 500);
			}*/
		};

		var add_snapshot = function(element) {
			$(element).data("snapshot", this).addClass("item");

			var $container = $("#snapshots").append(element);
			var $camera = $("#camera");
			var camera_ratio = $camera.innerWidth() / $camera.innerHeight();

			var height = $container.height()
			element.style.height = "" + height + "px";
			element.style.width = "" + Math.round(camera_ratio * height) + "px";

			var scroll = $container[0].scrollWidth - $container.innerWidth();

			$container.animate({
				scrollLeft: scroll
			}, 200);
		};

		var select_snapshot = function () {
			$(".item").removeClass("selected");
			var snapshot = $(this).addClass("selected").data("snapshot");
			$("#discard_snapshot, #upload_snapshot, #api_url").show();
			snapshot.show();
			$("#show_stream").show();
		};

		var clear_upload_data = function() {
			$("#upload_status, #upload_result").html("");
		};

		var upload_snapshot = function() {
			var api_url = $("#api_url").val();

			if (!api_url.length) {
				$("#upload_status").html("Please provide URL for the upload");
				return;
			}

			clear_upload_data();
			$("#loader").show();
			$("#upload_snapshot").prop("disabled", true);

			var snapshot = $(".item.selected").data("snapshot");
			snapshot.upload({api_url: api_url}).done(upload_done).fail(upload_fail);
		};

		var upload_done = function(response) {
			$("#upload_snapshot").prop("disabled", false);
			$("#loader").hide();
			$("#upload_status").html("Upload successful");
			$("#upload_result").html(response);
		};

		var upload_fail = function(code, error, response) {
			$("#upload_snapshot").prop("disabled", false);
			$("#loader").hide();
			$("#upload_status").html(
				"Upload failed with status " + code + " (" + error + ")");
			$("#upload_result").html(response);
		};

		var discard_snapshot = function() {
			var element = $(".item.selected").removeClass("item selected");

			var next = element.nextAll(".item").first();

			if (!next.size()) {
				next = element.prevAll(".item").first();
			}

			if (next.size()) {
				next.addClass("selected");
				next.data("snapshot").show();
			}
			else {
				hide_snapshot_controls();
			}

			element.data("snapshot").discard();

			element.hide("slow", function() {$(this).remove()});
		};

		var show_stream = function() {
			$(this).hide();
			$(".item").removeClass("selected");
			hide_snapshot_controls();
			clear_upload_data();
			camera.show_stream();
		};

		var hide_snapshot_controls = function() {
			$("#discard_snapshot, #upload_snapshot, #api_url").hide();
			$("#upload_result, #upload_status").html("");
			$("#show_stream").hide();
		};

		$("#take_snapshots").click(function() {take_snapshots(1);});
		$("#snapshots").on("click", ".item", select_snapshot);
		$("#upload_snapshot").click(upload_snapshot);
		$("#discard_snapshot").click(discard_snapshot);
		$("#show_stream").click(show_stream);

		var options = {
			shutter_ogg_url: "../dist/shutter.ogg",
			shutter_mp3_url: "../dist/shutter.mp3",
			swf_url: "../dist/jpeg_camera.swf"
		}

		camera = new JpegCamera("#camera", options).ready(function(info) {
			$('video').removeAttr('style');
			$("#take_snapshots").show();

			$("#camera_info").html(
				"Camera resolution: " + info.video_width + "x" + info.video_height
			);
			
			var brightness="100", sepia="0", contrast="100", saturation="100", updateFilters = function(){
				var filterCSS = 'brightness(' + brightness + '%) ' +
					'sepia(' + sepia + '%) ' +
					'contrast(' + contrast + '%) ' +
					'saturate(' + saturation + '%)';
				$('video').attr('style', 'filter: ' + filterCSS);
				$preview_canvas.style.filter = filterCSS;
			};
			$('#brightness').on('input', function(){ brightness = this.value.toString(); updateFilters(); } );
			$('#sepia').on('input', function(){ sepia = this.value.toString(); updateFilters(); } );
			$('#contrast').on('input', function(){ contrast = this.value.toString(); updateFilters(); } );
			$('#saturation').on('input', function(){ saturation = this.value.toString(); updateFilters(); } );
			$('#resetOptions').on('click', function(){
				$('#brightness')[0].value = '100';
				$('#sepia')[0].value = '0';
				$('#contrast')[0].value = '100';
				$('#saturation')[0].value = '100';
			});
			
			if (Math.max(info.video_width,info.video_height)<1120 || Math.min(info.video_width,info.video_height)<630){
				alert("Your deveice's camera has a resolution of " + info.video_width + "x" + info.video_height + ". The images you take with this camera will not count because they are too low resolution.");
			}
		});
	}
});
