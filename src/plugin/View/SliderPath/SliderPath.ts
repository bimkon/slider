/* eslint-disable no-restricted-globals */
import bind from 'bind-decorator';
import RangePathLine from '../RangePathLine/RangePathLine';
import ThumbView from '../ThumbView/ThumbView';
import Scale from '../Scale/Scale';
import EventObserver from '../../EventObserver/EventObserver';
import SliderOptions from '../../SliderOptions';
import {
  calculateToPercents,
  calculateToPixels,
  calculateValueToPercents,
} from '../formulas';

interface PositionTypes {
  position: number;
  pointerToMove: string;
}

class SliderPath {
  observer = new EventObserver<PositionTypes>();

  pathElement: HTMLElement = document.createElement('div');

  rangePathLine: RangePathLine = new RangePathLine();

  thumbElement: HTMLElement | null = null;

  scale: Scale | null = null;

  valueToPercents: number | undefined = undefined;

  percentsToPixels: number | undefined = undefined;

  fromValuePointer: ThumbView | null = null;

  toValuePointer: ThumbView | null = null;

  shift: number | null = null;

  newPosition: number | undefined = undefined;

  newPositionInPercents: number | undefined = undefined;

  midBetweenPointers: number | undefined = undefined;

  axis: Record<string, string> = {};

  options: SliderOptions | null = null;

  constructor() {
    this.axis = {};
    this.createTemplate();
  }

  createTemplate() {
    this.pathElement.classList.add('js-bimkon-slider__path');
    this.pathElement.append(this.rangePathLine.pathLine);
    this.pathElement.append(this.rangePathLine.emptyBar);
    this.fromValuePointer = new ThumbView(this.pathElement);
    if (this.fromValuePointer.thumbElement instanceof Node) {
      this.pathElement.append(this.fromValuePointer.thumbElement);
    }

  }

  initRangeSlider() {
    this.toValuePointer = new ThumbView(this.pathElement);
    if (this.toValuePointer.thumbElement instanceof Node) {
      this.pathElement.append(this.toValuePointer.thumbElement);
    }

    if (this.fromValuePointer === null) return;
    this.fromValuePointer.observer.subscribe(this.dispatchThumbPosition);
    this.toValuePointer.observer.subscribe(this.dispatchThumbPosition);
  }

  subscribeToThumb() {
    if (this.fromValuePointer === null) return;
    this.fromValuePointer.observer.subscribe(this.dispatchThumbPosition);
  }

  setPointerPosition(data: {
    fromInPercents: number;
    toInPercents: number;
    options: SliderOptions;
  }) {
    const { fromInPercents, toInPercents, options } = data;
    this.options = options;
    this.axis.direction = this.options.isVertical ? 'top' : 'left';
    this.axis.eventClientOrientation = this.options.isVertical
      ? 'clientY'
      : 'clientX';
    this.axis.offsetParameter = this.options.isVertical
      ? 'offsetHeight'
      : 'offsetWidth';
    this.axis.styleOrientation = this.options.isVertical ? 'height' : 'width';
    if (this.fromValuePointer === null) return;
    this.fromValuePointer.updatePointerPosition(fromInPercents, options);
    if (this.toValuePointer) this.toValuePointer.updatePointerPosition(toInPercents, options);
    this.updateRangeLine(fromInPercents, toInPercents);
  }

  @bind
  updateRangeLine(fromInPercents: number, toInPercents: number) {
    if (this.options === null) return;
    if (this.options.isRange) {
      this.rangePathLine.pathLine.style[
        this.axis.direction
      ] = `${fromInPercents}%`;
      this.rangePathLine.pathLine.style[this.axis.styleOrientation] = `${
        toInPercents - fromInPercents
      }%`;
    } else {
      this.rangePathLine.pathLine.style[this.axis.direction] = '0%';
      this.rangePathLine.pathLine.style[
        this.axis.styleOrientation
      ] = `${fromInPercents}%`;
    }
  }

  updateEventListenersToScale() {
    if (this.scale === null) return;
    this.scale.scale.removeEventListener('click', this.handleScaleClick);
    this.scale.scale.addEventListener('click', this.handleScaleClick);
  }

  @bind
  handleScaleClick(event: MouseEvent) {
    const target = event.target as HTMLTextAreaElement;
    const scaleValue = Number(target.textContent);
    if (target.classList.contains('bimkon-slider__scale')) return;
    if (this.options === null || this.options.min === undefined) return;
    if (this.options.max === undefined) return;
    this.valueToPercents = calculateValueToPercents(
      scaleValue,
      this.options.min,
      this.options.max,
    );
    if (this.options.isVertical === undefined) return;
    this.percentsToPixels = calculateToPixels({
      valueInPercents: this.valueToPercents,
      pathElement: this.pathElement,
      isVertical: this.options.isVertical,
    });
    this.newPositionInPercents = calculateToPercents({
      valueInPixels: this.percentsToPixels,
      pathElement: this.pathElement,
      isVertical: this.options.isVertical,
    });
    this.dispatchThumbPositionOnScaleClick();
  }

  @bind
  updateEventListenersToBar() {
    this.removeEventListenersFromBar();
    this.bindEventListenersToBar();
  }

  @bind
  bindEventListenersToBar() {
    this.rangePathLine.emptyBar.addEventListener(
      'mousedown',
      this.handleRangePathLineMouseDown,
    );
    this.rangePathLine.emptyBar.addEventListener(
      'dragstart',
      this.handleRangePathLineDragStart,
    );
  }

  @bind
  removeEventListenersFromBar() {
    this.rangePathLine.emptyBar.removeEventListener(
      'mousedown',
      this.handleRangePathLineMouseDown,
    );
    this.rangePathLine.emptyBar.removeEventListener(
      'dragstart',
      this.handleRangePathLineDragStart,
    );
  }

  @bind
  handleRangePathLineMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.shift = 0;
    if (this.newPosition === undefined) return;
    this.newPosition = this.calculateNewPosition();
    if (this.options === undefined || this.options === null) return;
    if (this.newPosition === undefined) return;
    this.newPositionInPercents = calculateToPercents({
      valueInPixels: this.newPosition,
      pathElement: this.pathElement,
      isVertical: this.options.isVertical as boolean,
    });
    this.dispatchThumbPositionOnScaleClick();
    document.addEventListener('mousemove', this.handleDocumentMouseMove);
    document.addEventListener('mouseup', this.handleDocumentMouseUp);
    document.addEventListener('dragstart', this.handleRangePathLineDragStart);
  }

  @bind
  handleDocumentMouseMove(event: MouseEvent) {
    event.preventDefault();
    this.dispatchThumbOnMouseMove();
  }

  @bind
  handleDocumentMouseUp() {
    document.removeEventListener('mouseup', this.handleDocumentMouseUp);
    document.removeEventListener('mousemove', this.handleDocumentMouseMove);
    document.removeEventListener(
      'dragstart',
      this.handleRangePathLineDragStart,
    );
  }

  dispatchThumbOnMouseMove() {
    if (this.fromValuePointer === null || this.fromValuePointer.thumbElement === null) return;
    const rightEdge = this.pathElement[this.axis.offsetParameter]
      - this.fromValuePointer.thumbElement[this.axis.offsetParameter]
      + this.fromValuePointer.thumbElement[this.axis.offsetParameter];
    if (this.options === null) return;
    if (this.options.isRange) {
      this.newPosition = this.calculateNewPosition();
      if (this.newPosition === undefined) return;
      if (this.newPosition < 0) {
        this.newPosition = 0;
      }
      if (this.newPosition > rightEdge) {
        this.newPosition = rightEdge;
      }

      this.midBetweenPointers = this.calculateMidBetweenPointers();
      if (this.newPosition === null || this.fromValuePointer === null) return;
      if (this.newPosition === undefined || this.midBetweenPointers === undefined) return;
      const newPositionSmallerThenMidBetweenPointers = this.newPosition < this.midBetweenPointers
        && this.fromValuePointer.thumbElement.classList.contains(
          'bimkon-slider__thumb_selected',
        );
      if (this.toValuePointer === null || this.toValuePointer.thumbElement === null) return;
      if (this.newPosition === undefined || this.midBetweenPointers === undefined) return;
      const newPositionBiggerThenMidBetweenPointers = this.newPosition > this.midBetweenPointers
        && this.toValuePointer.thumbElement.classList.contains(
          'bimkon-slider__thumb_selected',
        );

      if (newPositionSmallerThenMidBetweenPointers) {
        if (this.newPosition === undefined) return;
        this.dispatchThumbPosition({
          position: calculateToPercents({
            valueInPixels: this.newPosition,
            pathElement: this.pathElement,
            isVertical: this.options.isVertical as boolean,
          }),
          pointerToMove: this.fromValuePointer,
        });
      }
      if (newPositionBiggerThenMidBetweenPointers) {
        if (this.newPosition === undefined) return;
        this.dispatchThumbPosition({
          position: calculateToPercents({
            valueInPixels: this.newPosition,
            pathElement: this.pathElement,
            isVertical: this.options.isVertical as boolean,
          }),
          pointerToMove: this.toValuePointer,
        });
      }
    } else {
      this.newPosition = this.calculateNewPosition();
      if (this.newPosition === undefined) return;
      if (this.newPosition < 0) {
        this.newPosition = 0;
      }

      if (this.newPosition > rightEdge) {
        this.newPosition = rightEdge;
      }
      if (this.newPosition === null || this.fromValuePointer === null) return;
      if (this.newPosition === undefined) return;
      this.dispatchThumbPosition({
        position: calculateToPercents({
          valueInPixels: this.newPosition,
          pathElement: this.pathElement,
          isVertical: this.options.isVertical as boolean,
        }),
        pointerToMove: this.fromValuePointer,
      });
    }
  }

  dispatchThumbPositionOnScaleClick() {
    if (this.options === null || this.newPositionInPercents === undefined) return;
    if (this.options.isRange) {
      this.midBetweenPointers = this.calculateMidBetweenPointers();
      this.newPosition = this.calculateNewPosition();
      if (this.toValuePointer === null || this.newPosition === undefined) return;
      if (this.midBetweenPointers === undefined) return;
      if (this.newPosition > this.midBetweenPointers) {
        this.dispatchThumbPosition({
          position: this.newPositionInPercents,
          pointerToMove: this.toValuePointer,
        });
      } else {
        if (this.fromValuePointer === null) return;
        this.dispatchThumbPosition({
          position: this.newPositionInPercents,
          pointerToMove: this.fromValuePointer,
        });
      }
    } else {
      if (this.fromValuePointer === null) return;
      this.dispatchThumbPosition({
        position: this.newPositionInPercents,
        pointerToMove: this.fromValuePointer,
      });
    }
  }

  handleRangePathLineDragStart() {
    return false;
  }

  updateEventListenersToThumb(isRange: boolean) {
    if (this.fromValuePointer === null || this.toValuePointer === null) return;
    this.fromValuePointer.updateEventListeners();
    if (isRange) this.toValuePointer.updateEventListeners();
  }

  @bind
  dispatchThumbPosition(data: { position: number; pointerToMove?: ThumbView }) {
    const { position, pointerToMove } = data;
    if (pointerToMove === undefined) return;
    this.updateZIndex(pointerToMove);
    this.observer.broadcast({
      position,
      pointerToMove: this.checkPointerType(pointerToMove) as string,
    });
  }

  checkPointerType(pointer: ThumbView) {
    switch (pointer) {
      case this.fromValuePointer:
        return 'fromValue';
      case this.toValuePointer:
        return 'toValue';
      default:
        return null;
    }
  }

  private updateZIndex(pointer: ThumbView) {
    switch (pointer) {
      case this.fromValuePointer:
        if (this.toValuePointer) {
          if (this.toValuePointer.thumbElement === null) return;
          this.toValuePointer.thumbElement.classList.remove(
            'bimkon-slider__thumb_selected',
          );
        }
        break;
      case this.toValuePointer:
        if (this.fromValuePointer === null) return;
        if (this.fromValuePointer.thumbElement === null || this.fromValuePointer === null) return;
        this.fromValuePointer.thumbElement.classList.remove(
          'bimkon-slider__thumb_selected',
        );
        break;
      default:
    }
    if (pointer.thumbElement === null) return;
    pointer.thumbElement.classList.add('bimkon-slider__thumb_selected');
  }

  calculateMidBetweenPointers() {
    if (this.fromValuePointer === null
       || this.fromValuePointer.thumbElement === null) return;
    if (this.toValuePointer === null || this.toValuePointer.thumbElement === null) return;
    const calculatedValue = (this.toValuePointer.thumbElement.getBoundingClientRect()[
      this.axis.direction
    ]
        - this.fromValuePointer.thumbElement.getBoundingClientRect()[
          this.axis.direction
        ])
        / 2
      + this.fromValuePointer.thumbElement.getBoundingClientRect()[
        this.axis.direction
      ]
      - this.pathElement.getBoundingClientRect()[this.axis.direction]
      + this.fromValuePointer.thumbElement[this.axis.offsetParameter] / 2;
    return calculatedValue;
  }

  calculateNewPosition() {
    if (event === undefined) return;
    const newPosition = event[this.axis.eventClientOrientation]
      - this.pathElement.getBoundingClientRect()[this.axis.direction];
    return newPosition;
  }
}

export default SliderPath;
