

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

let subTaskCounter = 0;
const subTask = $('#task-subtask-title');
const subTaskButton = $('#task-subtask-add');
const subTaskList = $('#task-subtask-list');

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
});

async function taskList(){
	tableFoot.show();

	const { task } = await $.ajax({
		url: `${ baseUrl }/api/task/trash`,
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
		addRows(item.id, item.title, item.subtask, item.status, item.is_published, item.created_at, item.deleted_at);
	});
}

function addRows(id, title, subtask, status, is_published, created_at, deleted_at){
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

	let subtaskCounter = 0;
	const jsonSubtask = JSON.parse(subtask);
	for (let i = 0; i < jsonSubtask.length; i++) {
		const el = jsonSubtask[i];
		if(el.is_done === true){
			subtaskCounter = subtaskCounter + 1;
		}
	}
	const percent =  ((subtaskCounter / jsonSubtask.length) * 100).toFixed(2)

   let currentDate = new Date();
   let deletionDate = new Date(formatDate(deleted_at));
   deletionDate.setDate(deletionDate.getDate() + 30);
   let timeDiff = deletionDate.getTime() - currentDate.getTime();
   let daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

   const row = `
      <tr id="row-${ id }">
         <td > #${ id } </td>
         <td class="fw-bold"> ${ title } </td>
         <td class="fw-bold"> 
            <ul class="list-group list-group-flush">
               <li class="list-group-item p-0">
                  <p class="mb-1 fw-bold text-end"> ${ percent }% </p>
                  <div class="progress progress-sm">
                     <div class="progress-bar" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: ${ percent }%;"></div>
                  </div>
               </li>
            </ul>
         </td>
         <td>
            <span class="badge badge-${ status_color }-lighten">${ status_value }</span>
         </td>
         <td>
            <span class="badge badge-${ publish_color }-lighten">${ publish_value }</span>
         </td>
         <td>
            ${ formatDate(deleted_at) }
         </td>
         <td>
            ${ daysRemaining }
         </td>
         <td>
            <i class="ri-eye-line font-20 text-danger cursor-pointer" onclick="showItem(${ id })"></i>
         </td>
      </tr>
   `;
   tableBody.prepend(row)
}

async function showItem(id){
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
						</div> 
					</div>
				</div> 
			</div> 
		`);
	}

	subTaskList.empty()
	const jsonSubTask = JSON.parse(task.subtask)
	for (let index = 0; index < jsonSubTask.length; index++) {
		const el = jsonSubTask[index];
		
		subTaskList.prepend(`
			<li class="list-group-item d-flex justify-content-between align-items-center" id="subTask-item-${ index }">
				<div>
					<input class="form-check-input me-1" type="checkbox" value="" id="subTask-${ index }" disabled>
					<label class="form-check-label" id="subTask-title-${ index }">${ el.name }</label>
				</div>
			</li>
		`);
		
		$(`#subTask-${ index }`).prop('checked', el.is_done);
	}
	subTaskCounter = jsonSubTask.length

	button.data('update-id', task.id)
	title.val(task.title)
	content.val(task.content)
	statused.val(task.status)
	publish.prop('checked', (task.is_published == '1' ? true : false))
	taskModal.modal('show')
}