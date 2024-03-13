

const title = $('#task-title');
const content = $('#task-content');
const attachment = $('#task-attachment');
let imageCounter = 0;
let imageStorage = [];
const attachment_preview = $('#task-attachment-preview');
const statused = $('#task-status');
const publish = $('#task-publish');
const button = $('#task-action');
const buttonText = button.find('#title');
const buttonSpinner = button.find('#spinner');
const taskModal = $('#task-modal');

const itemsPerPage = $('#table-pages')
const table = $('#task-table');
const tableBody = table.find('#task-table-body');
const tableFoot = table.find('#task-table-foot');
const tablePage = $('#table-paging');
let currentPage = 1;
let taskData = [];
let filteredData = [];

$(document).ready(function() {
	buttonSpinner.hide();

	if(!isAuthenticated()){
		window.location.href = './index.html';
	}
	taskList()

	itemsPerPage.on('change', function(){
		const paging = $(this).val()
		const data = ($('#table-status-filter').val() != 'All' || $('#table-search-filter').val().length > 0) ? filteredData : taskData

		totalPages(data, paging)
		displayItems(data, paging)
	});

	$('#table-status-filter, #table-search-filter').on('change keyup', function() {
		const isStatusFilter = $(this).is('#table-status-filter');
		const selected = isStatusFilter ? $(this).val().toLowerCase() : $('#table-status-filter').val().toLowerCase();
		const search = isStatusFilter ? $('#table-search-filter').val().toLowerCase() : $(this).val().toLowerCase();
  
		filterAndSearchTable(selected, search);
	});

	$('#task-page').on('keyup', function(){
		const page = ($(this).val() == "" ? 1 : $(this).val())
		changePage(page)
	});

	attachment.on('change', function(){
		const files = $(this).prop('files')
		const mbSize = 1048576;
		$.each(files, function(index, file) {
			imageStorage.push(file)
			const name = file.name
			const size = (file.size / mbSize).toFixed(2)
			
			if((mbSize * 4) > size){
				attachment_preview.append(`
					<div class="col-xxl-6 col-lg-6" id="rows-image-${ imageCounter }">
						<div class="card m-1 shadow-none border">
							<div class="p-2">
								<div class="row align-items-center">
									<div class="col-auto">
										<div class="avatar-sm">
											<span class="avatar-title bg-light text-reset rounded">
												<i class="mdi mdi-file-image font-16"></i>
											</span>
										</div>
									</div>
									<div class="col ps-0">
										<a href="javascript:void(0);" class="text-muted fw-bold">${ name }</a>
										<p class="mb-0 font-13">${ size } MB</p>
									</div>
									<div class="col-auto">
										<a href="javascript:void(0);" class="btn btn-link btn-lg text-muted" onclick="deleteImage('rows-image-${ imageCounter }')">
											<i class="ri-delete-bin-line"></i>
										</a>
									</div>
								</div> 
							</div>
						</div> 
					</div> 
				`);
				imageCounter = imageCounter + 1;
			}
			else {
				alert(`File ${ name } exceed 4MB.`);
			}
		});
	});

	$('#task-action').on('click', function(){
		addItem()
	});
});

function clearFields(){
	title.val('')
	content.val('')
	attachment.val('')
	attachment_preview.empty()
	statused.val('')
	publish.prop('checked', true)
	button.data('update-id', '0')
	$('.error-message').text('');
	imageCounter = 0
	imageStorage = []
}

async function taskList(){
	tableFoot.show();

	const { task } = await $.ajax({
		url: `${ baseUrl }/api/task`,
		method: 'GET',
		dataType: 'json',
		headers:{
			'Authorization':`Bearer ${ token }`,
		}
	});
	
	if(task.length > 0){
		tableFoot.hide()
	}

	taskData = task;
	totalPages(task, itemsPerPage.val())
	displayItems(task, itemsPerPage.val())
}

function formatDate(timestampString) {
	const date = new Date(timestampString);
	const monthAbbreviation = date.toLocaleString('default', { month: 'short' });
	const day = date.getDate();
	const year = date.getFullYear();
	const formattedDate = `${ monthAbbreviation } ${ day }, ${ year }`;

	return formattedDate;
}

function filterAndSearchTable(selected, search) {
	
	const statusLabels = {
		'0': 'To-do',
		'1': 'In-progress',
		'2': 'Done'
	};
	
	const filteredRows = taskData.filter(item => {
		let status = item.status.toLowerCase().trim()
		const statusLabel = (statusLabels[status] || status).toLowerCase().trim();
		const select = selected.toLowerCase().trim()

		return (select === "all" || statusLabel === select) && item.title.includes(search)
	})

	totalPages(filteredRows, itemsPerPage.val())
	displayItems(filteredRows, itemsPerPage.val())

	filteredData = filteredRows
	filteredRows.length > 0 ? tableFoot.hide() : tableFoot.show();

}

function totalPages(data, itemsPerPage) {
	const totalItems = data.length;
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	$('#table-maxpage').text(totalPages);
}

function changePage(page) {
	currentPage = page;
	const data = filteredData.length > 0 ? filteredData : taskData
	displayItems(data, itemsPerPage.val());
}

function displayItems(data, itemsPerPage) {
	const totalPages = parseInt($('#table-maxpage').text());
	const lastPage = (totalPages - 1) > (currentPage - 1) ? (currentPage - 1) : (totalPages - 1)
	const startIndex = lastPage * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const itemsToShow = data.slice(startIndex, endIndex);

	itemsToShow.length > 0 ? tableFoot.hide() : tableFoot.show();
	
	tableBody.empty();
	itemsToShow.forEach(item => {
		addRows(item.id, item.title, item.status, item.is_published, item.created_at);
	});
}

function addRows(id, title, status, is_published, created_at, rowId = 0){
	let status_color = '';
	let status_value = '';
	switch (status) {
		case '0':
			status_color = 'danger'
			status_value = 'To-do'
		break;
		case '1':
			status_color = 'info'
			status_value = 'In-progress'
		break;
		case '2':
			status_color = 'success'
			status_value = 'Done'
		break;
	}

	const publish_color = (is_published == '1' ? 'success' : 'warning')
	const publish_value = (is_published == '1' ? 'Published' : 'Save as Draft')

	if(rowId == 0){
		const row = `
			<tr id="row-${ id }">
				<td > #${ id } </td>
				<td class="fw-bold"> ${ title } </td>
				<td>
					<span class="badge badge-${ status_color }-lighten">${ status_value }</span>
				</td>
				<td>
					<span class="badge badge-${ publish_color }-lighten">${ publish_value }</span>
				</td>
				<td>
					${ formatDate(created_at) }
				</td>
				<td>
					<i class="ri-edit-box-line font-20 text-warning cursor-pointer" onclick="updateItem(${ id })"></i>
					<i class="ri-subtract-line font-20 rotate-90"></i>
					<i class="ri-delete-bin-line font-20 text-danger cursor-pointer" onclick="deleteItem(${ id })"></i>
				</td>
			</tr>
		`;
		tableBody.prepend(row)
	}
	else {
		const existingRow = $(`#row-${ rowId }`)
		if (existingRow.length > 0) {
			existingRow.find('td:eq(0)').text(`#${ id }`);
			existingRow.find('td:eq(1)').text(title);
			existingRow.find('td:eq(2)').html(`<span class="badge badge-${status_color}-lighten">${status_value}</span>`);
			existingRow.find('td:eq(3)').html(`<span class="badge badge-${publish_color}-lighten">${publish_value}</span>`);
			existingRow.find('td:eq(4)').text(formatDate(created_at));
			return; 
		}
	}
}

async function addItem(){
	button.prop('disabled', true);
	buttonText.text('');
	buttonSpinner.show();
	const id = parseInt(button.data('update-id'))

	const formData = new FormData();
	for (let i = 0; i < imageStorage.length; i++) {
		const existingImage = $(`#rows-image-${ i }`).length
		if(existingImage == 1){
			formData.append('attachment[]', imageStorage[i]);
		}
	}
	formData.append('title', title.val());
	formData.append('content', content.val());
	formData.append('status', statused.val());
	formData.append('is_published', (publish.is(':checked') ? 1 : 0));
	
	try {
		let { task } = await $.ajax({
			url: (id == 0 ? `${ baseUrl }/api/task/create` : `${ baseUrl }/api/task/${ id }`),
			type: 'POST' , 
			dataType: 'json',
			data: formData, 
			headers:{
				'Authorization':`Bearer ${ token }`,
			},
			processData: false, 
			contentType: false,
		});

		if(id == 0){
			clearFields();
			if(taskData.length == 0){
				taskList()
			}
			alert(`Task ${ task.title } Successfully Added!`)
		}
		else {
			alert(`Task ${ task.title } Successfully Updated!`)
			taskModal.modal('hide')
		}
		
		addRows(task.id, task.title, task.status, task.is_published, task.created_at, id)
      setTimeout(function () {
         button.prop('disabled', false);
         buttonText.text('Save');
         buttonSpinner.hide();
      }, 2000);

	} catch (error) {
		const status_code = error.status;
      const errors = error.responseJSON?.error;
      $('.error-message').text('');

      switch (status_code) {
         case 422:
            $('.error-message').text('');
            Object.entries(errors).forEach(([field, messages]) => {
               $(`#${field}-error`).text(messages[0]);
            });
         break;
      
         default:
         break;
      }

      button.prop('disabled', false);
      buttonText.text('Save');
      buttonSpinner.hide();
	}
}

async function updateItem(id){
	const { task } = await $.ajax({
		url: `${ baseUrl }/api/task/${ id }`,
		type: 'GET',
		dataType: 'json',
		headers:{
			'Authorization':`Bearer ${ token }`,
		},
	});

	attachment_preview.empty()
	const jsonAttachment = JSON.parse(task.attachment)
	for (let index = 0; index < jsonAttachment.length; index++) {
		const el = jsonAttachment[index];

		attachment_preview.append(`
			<div class="col-xxl-6 col-lg-6" id="rows-image-uploaded-${ index }">
				<div class="card m-1 shadow-none border">
					<div class="p-2">
						<div class="row align-items-center">
							<div class="col-auto">
								<div class="avatar-sm">
									<span class="avatar-title bg-light text-reset rounded">
										<i class="mdi mdi-file-image font-16"></i>
									</span>
								</div>
							</div>
							<div class="col ps-0">
								<a href="javascript:void(0);" class="text-muted fw-bold">${ el.name }</a>
								<p class="mb-0 font-13">${ el.size } MB</p>
							</div>
							<div class="col-auto">
								<a href="javascript:void(0);" class="btn btn-link btn-lg text-muted" onclick="deleteImage('rows-image-uploaded-${ index }', ${ task.id })">
									<i class="ri-delete-bin-line"></i>
								</a>
							</div>
						</div> 
					</div>
				</div> 
			</div> 
		`);
	}

	button.data('update-id', task.id)
	title.val(task.title)
	content.val(task.content)
	statused.val(task.status)
	publish.prop('checked', (task.is_published == '1' ? true : false))
	taskModal.modal('show')
}

async function deleteItem(id){
	const { task } = await $.ajax({
		url: `${ baseUrl }/api/task/${ id }`,
		method: 'DELETE',
		dataType: 'json',
		headers:{
			'Authorization':`Bearer ${ token }`,
		}
	});

	alert(`Task "${ task.title }" Successfully Deleted!`)

	const row = tableBody.find(`#row-${ id }`)
	row.remove()
}

function deleteImage(elementId, id = 0){
	if(id == 0){
		$(`#${ elementId }`).remove()
	}
	else {
		$(`#${ elementId }`).remove()
		const index = elementId.split('-').pop();
		$.ajax({
			url: `${ baseUrl }/api/task/image/${ id }`,
			type: 'DELETE',
			dataType: 'json',
			data: { deletedIndex: index },
			headers:{
				'Authorization':`Bearer ${ token }`,
			}
		});
	}
}