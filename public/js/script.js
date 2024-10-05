function openAddProductModal() {
    document.getElementById('product-modal').style.display = 'flex';
}

// Закрытие модального окна добавления товара
function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

function openSelectProductModal(){
    document.getElementById('product-box').style.display ='flex';
}


function sendCartToBot() {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || []; // Получаем товары из корзины

    fetch('/send-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: cartItems }) // Отправляем товары в формате JSON
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message); // Сообщение о статусе
    })
    .catch(error => console.error('Ошибка:', error));
}

function openModal(imageUrl, productName, productPrice) {
    // Установить изображение и заголовок
    document.getElementById('modal-image').src = imageUrl;
    document.getElementById('modal-title').innerText = productName;
    document.getElementById('modal-price').innerText = productPrice;
    
    // Показать модальное окно
    document.getElementById('product-modal').style.display = 'flex';
}



let currentImageIndex = 0; // Индекс текущего изображения
let productImages = []; // Массив с изображениями
let cart = []; // Массив для хранения товаров в корзине

function openModal(images, productName, productPrice) {
    productImages = images.split(','); // Преобразуем строку с изображениями в массив
    currentImageIndex = productImages.length - 1; // Начинаем с последнего изображения

    // Устанавливаем последнее изображение и данные продукта
    document.getElementById('modal-image').src = productImages[currentImageIndex];
    document.getElementById('modal-title').innerText = productName;
    document.getElementById('modal-price').innerText = productPrice;
    
    // Показать модальное окно
    document.getElementById('product-modal').style.display = 'flex';

    // Показать или скрыть кнопки "предыдущая" и "следующая" в зависимости от количества изображений
    toggleButtonsVisibility();
}

function prevImage() {
    if (currentImageIndex < productImages.length - 1) {
        currentImageIndex++;
        document.getElementById('modal-image').src = productImages[currentImageIndex];
    }
    toggleButtonsVisibility();
}

function nextImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        document.getElementById('modal-image').src = productImages[currentImageIndex];
    }
    toggleButtonsVisibility();
}

function toggleButtonsVisibility() {
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    prevBtn.style.display = (currentImageIndex === productImages.length - 1) ? 'none' : 'block';
    nextBtn.style.display = (currentImageIndex === 0) ? 'none' : 'block';
}

// Функция для добавления товара в корзину
function addToCart() {
    const productName = document.getElementById('modal-title').innerText;
    const productPrice = document.getElementById('modal-price').innerText;
    const productImage = productImages[currentImageIndex]; // Текущее изображение товара

    // Создаем объект для товара
    const product = {
        name: productName,
        price: productPrice,
        image: productImage
    };

    // Добавляем товар в корзину
    cart.push(product);

    // Обновляем отображение корзины
    updateCartDisplay();

    // Закрываем модальное окно после добавления товара
    closeProductModal();
}

// Функция для обновления отображения корзины
function updateCartDisplay() {
    const cartList = document.getElementById('cart-list');
    const cartTotal = document.getElementById('cart-total');
    cartList.innerHTML = ''; // Очищаем список перед обновлением

    let total = 0;

    cart.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <img src="${item.image}" width="50px" alt="${item.name}"> 
            ${item.name} - ${item.price} 
            <button class="remove-btn" onclick="removeFromCart(${index})"><img src="icons/delete.png" alt="delete" class="delete-btn-icon"></button>
        `;
        cartList.appendChild(listItem);

        // Извлекаем числовое значение цены и суммируем
        total += parseFloat(item.price.replace(/\D/g, ''));
    });

    cartTotal.innerText = `Общая сумма: ${total} ₸`;
}

// Функция для удаления товара из корзины
function removeFromCart(index) {
    cart.splice(index, 1); // Удаляем товар по индексу
    updateCartDisplay(); // Обновляем корзину после удаления
}


function sendCartToBot() {
    const telegramUrl = `https://api.telegram.org/bot6275254498:AAE430Olw0JiSfiyXJWhkzji71lxORJCUKI/sendMessage?chat_id=958530718&text=text`;

    fetch(telegramUrl)
      .then(response => {
          if (response.ok) {
              res.json({ message: 'Товары успешно отправлены в чат!' });
          } else {
              res.json({ message: 'Ошибка при отправке товаров в чат.' });
          }
      })
      .catch(error => {
          console.error('Ошибка:', error);
          res.json({ message: 'Ошибка при отправке товаров в чат.' });
      });
}


// Функция для закрытия модального окна
function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}
