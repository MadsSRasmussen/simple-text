export function generateCarretElement(): HTMLElement {

    const carret = document.createElement('span');
    carret.classList.add('carret');
    return carret;

}

export function generateTextboxElement(): HTMLElement {

    const container = document.createElement('div');
    container.classList.add('textBox');
    container.setAttribute('tabindex', '0')

    return container;

}