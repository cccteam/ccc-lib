import { CamelCaseToTitlePipe } from './camel-case-to-title.pipe';

xdescribe('CamelCaseToTitlePipe', () => {
  it('create an instance', () => {
    const pipe = new CamelCaseToTitlePipe();
    expect(pipe).toBeTruthy();
  });
});
