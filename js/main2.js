const body = document.body;

if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark');
}

const themeButton = document.querySelectorAll('.theme');

function tht() {
  body.classList.toggle('dark');

  if (body.classList.contains('dark')) {
    localStorage.setItem('theme', 'dark');
  } else {
    localStorage.removeItem('theme');
  }
}
themeButton.forEach(button => {
    button.addEventListener('click', tht);
});

console.log('hahahga')