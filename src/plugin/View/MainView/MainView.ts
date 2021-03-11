
import { SliderOptions } from '../../SliderOptions';
import { SliderPath } from '../SliderPath/SliderPath';
import bind from 'bind-decorator';


class MainView {
  
  public sliderElement: HTMLElement;
  public rootElement: HTMLElement;
  public sliderPath: SliderPath;
  public options: SliderOptions;
  public MinValue : HTMLElement;
  public MaxValue : HTMLElement;
  scaleValue: HTMLElement;


  constructor(options : SliderOptions) {
    this.createTemplate();

    const {
      isVertical, hasTip, isRange, min, max
    } = options;
    this.update({isVertical, hasTip, isRange, min, max});
  }
  
//поиск класса инициализации, создание блока слайдера, присвоение к родителю. Импорт и присвоение к блоку слайдера модуля класса Sliderpath который создает шкалу.
  private createTemplate() {
    this.rootElement = document.querySelector('.bimkon-slider');
    // this.sliderElement = document.createElement('div');
    // this.sliderElement.classList.add('js-bimkon-slider');
    // this.rootElement.append(this.sliderElement);
    this.sliderPath = new SliderPath();
    this.rootElement.append(this.sliderPath.pathElement);
  }

  private update(data:SliderOptions) {
    const {isVertical, hasTip, isRange} = data;
    if (isVertical) {
      this.makeOrientation(isVertical)
    }
    this.sliderPath.initMouseMoves(isVertical);
    this.sliderPath.initPathclick(isVertical);
    this.setScale(data);
  }
  private makeOrientation(isVertical:boolean) {
    if (isVertical) {
      this.sliderPath.pathElement.classList.add('js-bimkon-slider__path-vertical');
    }
    else {
      this.sliderPath.pathElement.classList.remove('js-bimkon-slider__path');
    }
    
    
  }

  public setPointerPosition(data: {
    min: number, 
    max: number,
    fromPointerValue: number,
    fromPointerInPercents: number,
    options: SliderOptions,
  }) {
    const { min, max, fromPointerValue, fromPointerInPercents, options } = data;

    this.updateTipValue(fromPointerValue, options);
    this.sliderPath.updatePointerPosition(fromPointerInPercents, options);

  }

  updateTipValue(
    fromPointerValue: number,
    options: SliderOptions,

  ) {
    const {hasTip} = options;
    if (hasTip) {
    this.sliderPath.thumb.tip.setTipValue(Math.floor(fromPointerValue));
    }
    else {
      this.sliderPath.thumb.tip.tipElement.classList.remove('js-bimkon-slider__tip');
    }
  }
  
  setScale(data: SliderOptions) {
    const {min, max} =data;

    this.sliderPath.scale.initNumberOnScale(min, max);
    this.sliderPath.bindEventListenersToScale(min, max);

  }


}

export { MainView };