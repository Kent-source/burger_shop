class EventEmmiter {
    constructor() {
        this.container = $('body')
    }

    pub(request, param = undefined) {
        this.container.get(0).dispatchEvent(new CustomEvent(request, param))
    }
    sub(request, func) {
        this.container.get(0).addEventListener(request, func)
    }
}
class Menu extends EventEmmiter {
    constructor(categories, region) {
        super();

        this.categories = categories;
        this.selected = this.categories[0];
        this.region = region

        setTimeout(() => this.changeCategory(this.selected), 0)
    }
    render() {
        this.clearCategory()
        this.categories.map(category => {
            const button = document.createElement('button');
            const classList = ['asideMenu', 'flexColomn'];
            if (category === this.selected) {
                classList.push('active');
            }
            button.classList.add(...classList);
            button.innerText = category;
            button.addEventListener('click', () => this.changeCategory(category));
            this.region.append(button)
        })
    }

    clearCategory() {
        $(this.region).empty();
    }

    changeCategory(categ) {
        this.selected = categ;
        this.render();
        this.pub('categoryChanged')
    }
}

class Product extends EventEmmiter {
    constructor(product) {
        super();

        this.id = product.id;
        this.name = product.name;
        this.description = product.description;
        this.image = product.image;
        this.price = product.price;
        this.category = product.category;
        this.market = product.market;
        this.type = product.type;
        this.weight = product.weight;
        this.components = product.components;

        this._quantity = 0;
    }

    get quantity() {
        return this._quantity;
    }

    set quantity(value) {
        this._quantity = value;
        this.pub('changeQuantity', this)
        $(`#${this.id} .quantity`).val(this.quantity);
    }

    getTemplate() {
        const element = $('#cardTemplate').clone().children()
        element.attr('id', this.id)
        element.find('.imgMarket').attr('src', `..${this.market ? data.markets[this.market].image : ''}`)
        element.find('.imgProduct').attr('src', `..${this.image}`)
        element.find('.nameProduct').text(`${this.name}`)
        element.find('.descriptionProduct').text(`${this.description}`)
        element.find('.priceProduct').text(`Цена: ${this.price} руб.`)
        element.find(`.stepUp`).on('click', () => this.stepUp())
        element.find(`.stepDown`).on('click', () => this.stepDown())
        element.find(`.quantity`).on('change', (e) => this.change(e))
        element.find('.inBasketProduct').on('click', () => this.inBasket())

        return element;
    }

    stepUp() {
        this.quantity++
    }

    stepDown() {
        this.quantity--
    }

    change(e) {
        this.quantity = e.target.value;
    }

    inBasket() {
        this.pub('addProductInBasket', {
            detail: {
                product: this,
            }
        })
    }
}

class Store extends EventEmmiter {
    constructor(data) {
        super()
        this.data = data;
    }

    init() {
        const products = [];
        const allCategories = [];
        this.data.menu.forEach((product, index) => {
            allCategories.push(product.category);
            products.push(new Product({ id: index, ...product }));
        })
        const categories = unique(allCategories);
        this.products = products;
        this.menu = new Menu(categories, $('.aside').get(0));
        this.menu.sub('categoryChanged', () => {
            store.clearProduct()
            store.renderProducts()
        })
        this.basket = new Basket(this.putProductInBasket);
        this.sub('addProductInBasket', (event) => {
            this.pub('addProductInBasketIn', {
                detail: event.detail
            })
        })
    }

    renderMain() {
        this.container.append(`<div class="header flex">
        <p>СДЕЛАЙТЕ ЗАКАЗ НА ПРЯМУЮ ИЗ РЕСТОРАНА</p></div>
        <div class="content flex">
            <div class="leftMenu flex">
                <div class="aside"></div>
                <div class="basket flex"></div>
            </div>    
            <div class="productView flex"></div>
        </div>`)
    }

    renderProducts() {
        const filteredProducts = this.products.filter(product => product.category === this.menu.selected);
        const templates = filteredProducts.map(product => {
            product.sub('addBast');
            return product.getTemplate();
        })
        $('.productView').append(...templates);
    }

    clearProduct() {
        $(".productView").empty();
    }
}

class Basket extends EventEmmiter {
    constructor() {
        super()
        this.products = new Map();
    }

    endBasketButton() {
        this.products.clear()
        $(".productBasket").empty()
        $(".priceBasket").empty()
        $(".priceBasket").append(`<p> Итого: 0 руб. </p>`)
    }

    render() {
        const element = $('#BasketProduct').children().clone()
        element.appendTo('.basket')
        $(".inBasketProductEnd").on('click', this.endBasketButton.bind(this))
        this.container.get(0).addEventListener('addProductInBasketIn', (event) => {
            const { product } = event.detail;
            const { quantity } = product;
            if (this.products.has(product)) {
                let inc = this.products.get(product)
                this.products.set(product, parseInt(inc) + parseInt(quantity))
            }
            else {
                this.products.set(product, quantity)
            }
            this.allProduct(this.products)
        })

        this.container.get(0).addEventListener('changeQuantity', () => {
            this.allProduct(this.products)
        });
    }

    allProduct(mapProduct) {
        $(".productBasket").empty()
        let endPriceBasket = 0;
        for (const p of mapProduct.entries()) {
            const [product] = p
            const { name, quantity } = product;
            if (quantity != 0) {
                $(".productBasket").append(`
                <div class="descriptionBasket flex">
                    <p>${name}</p>
                    <p>${quantity}</p>
                `)
                endPriceBasket = endPriceBasket + (parseInt(quantity) * parseInt(product.price))
            }
        }
        $(".priceBasket").empty()
        $(".priceBasket").append(`
        <p> Итого: ${endPriceBasket} руб. </p>
        `)
    }
}

store = new Store(data)
store.renderMain();
store.init();
store.menu.render('.aside');
store.basket.render();

function unique(allCat) {
    const categories = [];
    for (let cat of allCat) {
        if (!categories.includes(cat)) {
            categories.push(cat);
        }
    }
    return categories;
}
