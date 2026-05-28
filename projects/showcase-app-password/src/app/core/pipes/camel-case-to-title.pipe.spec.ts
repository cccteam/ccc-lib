import { CamelCaseToTitlePipe } from './camel-case-to-title.pipe';

const xdescribe = (describe as unknown as { skip?: typeof describe }).skip ?? describe;

xdescribe('CamelCaseToTitlePipe', () => {
  it('create an instance', () => {
    const pipe = new CamelCaseToTitlePipe();
    expect(pipe).toBeTruthy();
  });
});
