import { NgxTreeDndModule } from './ngx-tree-dnd-fork.module';

describe('NgxTreeDndModule', () => {
  let ngxTreeDndModule: NgxTreeDndModule;

  beforeEach(() => {
    ngxTreeDndModule = new NgxTreeDndModule();
  });

  it('should create an instance', () => {
    expect(ngxTreeDndModule).toBeTruthy();
  });
});
