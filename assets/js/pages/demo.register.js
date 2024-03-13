
const names = $('#name');
const email = $('#email');
const password = $('#password');
const button = $('#signup');
const buttonText = button.find('#title');
const buttonSpinner = button.find('#spinner');


$(document).ready(function() {
   buttonSpinner.hide()
   if(isAuthenticated()){
      window.location.href = './todo.html';
   }

   $('#signup').on('click', function() {
      signup();
  });
});

async function signup(){
   button.prop('disabled', true);
   buttonText.text('');
   buttonSpinner.show();

   try {
      const response = await $.ajax({
         url: `${ baseUrl }/api/register/create`,
         type: 'POST',
         dataType: 'json',
         data: {
            name: names.val(),
            email: email.val(),
            password: password.val()
         }, 
      });
      names.val('')
      email.val('')
      password.val('')
      alert(`Account ${ names.val() } Successfully Registered!`)
      setTimeout(function () {
         button.prop('disabled', false);
         buttonText.text('Sign up');
         buttonSpinner.hide();
      }, 3000);
      
   } catch(error){
      const status_code = error.status;
      const errors = error.responseJSON.error;
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
      buttonText.text('Sign up');
      buttonSpinner.hide();
   }
}