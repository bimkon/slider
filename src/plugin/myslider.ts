import { Model } from '../plugin/Model/Model';
import { MainView } from './View/MainView/MainView';
import { Presenter } from '../plugin/Presenter/Presenter';
import { SliderOptions } from './SliderOptions';


declare global {
  interface Window {
    $: JQuery;
  }
  interface JQuery {
    bimkonSlider: (
      options?: SliderOptions
    ) => JQuery<Element> | JQuery<Object>;
  }
}

(function($) {
  $.fn.extend({
    bimkonSlider: function(options: SliderOptions) {
      const model = new Model(options)
      const view = new MainView(options)
      const presenter = new Presenter(view, model, options)
  }})
}(jQuery))

$('.bimkon-slider').bimkonSlider({
  isRange: false,
  min: 2  ,
  max: 1100,
  step: 2,
  isVertical: false,
  from: 25,
  to: 45,
  hasTip: true,

})