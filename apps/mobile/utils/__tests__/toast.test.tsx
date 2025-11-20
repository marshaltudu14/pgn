import { Toast, showToast, setGlobalToastInstance } from '../toast';

describe('Toast Utility', () => {
  let mockToastInstance: jest.Mocked<any>;

  beforeEach(() => {
    // Reset global toast instance before each test
    mockToastInstance = {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn(),
      info: jest.fn(),
      dismiss: jest.fn(),
    };
    setGlobalToastInstance(mockToastInstance);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Toast class static methods', () => {
    it('should call success method with message when global instance exists', () => {
      const message = 'Test success message';
      const description = 'Test description';
      const duration = 5000;

      Toast.success(message, description, duration);

      expect(mockToastInstance.success).toHaveBeenCalledWith(message, description, duration);
      expect(mockToastInstance.error).not.toHaveBeenCalled();
      expect(mockToastInstance.warning).not.toHaveBeenCalled();
      expect(mockToastInstance.info).not.toHaveBeenCalled();
    });

    it('should call error method with message when global instance exists', () => {
      const message = 'Test error message';
      const description = 'Test error description';

      Toast.error(message, description);

      expect(mockToastInstance.error).toHaveBeenCalledWith(message, description, undefined);
      expect(mockToastInstance.success).not.toHaveBeenCalled();
      expect(mockToastInstance.warning).not.toHaveBeenCalled();
      expect(mockToastInstance.info).not.toHaveBeenCalled();
    });

    it('should call warning method with message when global instance exists', () => {
      const message = 'Test warning message';

      Toast.warning(message);

      expect(mockToastInstance.warning).toHaveBeenCalledWith(message, undefined, undefined);
      expect(mockToastInstance.success).not.toHaveBeenCalled();
      expect(mockToastInstance.error).not.toHaveBeenCalled();
      expect(mockToastInstance.info).not.toHaveBeenCalled();
    });

    it('should call info method with message when global instance exists', () => {
      const message = 'Test info message';
      const description = 'Test info description';
      const duration = 3000;

      Toast.info(message, description, duration);

      expect(mockToastInstance.info).toHaveBeenCalledWith(message, description, duration);
      expect(mockToastInstance.success).not.toHaveBeenCalled();
      expect(mockToastInstance.error).not.toHaveBeenCalled();
      expect(mockToastInstance.warning).not.toHaveBeenCalled();
    });

    it('should use info method as default when calling show method', () => {
      const message = 'Test generic message';

      Toast.show(message, 'info');

      expect(mockToastInstance.info).toHaveBeenCalledWith(message);
    });

    it('should call success method when show is called with success type', () => {
      const message = 'Test success via show';

      Toast.show(message, 'success');

      expect(mockToastInstance.success).toHaveBeenCalledWith(message);
    });

    it('should call error method when show is called with error type', () => {
      const message = 'Test error via show';

      Toast.show(message, 'error');

      expect(mockToastInstance.error).toHaveBeenCalledWith(message);
    });

    it('should call warning method when show is called with warning type', () => {
      const message = 'Test warning via show';

      Toast.show(message, 'warning');

      expect(mockToastInstance.warning).toHaveBeenCalledWith(message);
    });
  });

  describe('showToast wrapper', () => {
    it('should call success method on Toast class', () => {
      const message = 'Wrapper success test';

      showToast.success(message);

      expect(mockToastInstance.success).toHaveBeenCalledWith(message, undefined, undefined);
    });

    it('should call error method on Toast class', () => {
      const message = 'Wrapper error test';
      const description = 'Error description';

      showToast.error(message, description);

      expect(mockToastInstance.error).toHaveBeenCalledWith(message, description, undefined);
    });

    it('should call info method on Toast class', () => {
      const message = 'Wrapper info test';
      const duration = 4000;

      showToast.info(message, undefined, duration);

      expect(mockToastInstance.info).toHaveBeenCalledWith(message, undefined, duration);
    });

    it('should call warning method on Toast class', () => {
      const message = 'Wrapper warning test';

      showToast.warning(message);

      expect(mockToastInstance.warning).toHaveBeenCalledWith(message, undefined, undefined);
    });

    it('should call dismiss method on global instance when hide is called', () => {
      showToast.hide();

      expect(mockToastInstance.dismiss).toHaveBeenCalled();
    });
  });

  describe('Behavior without global instance', () => {
    beforeEach(() => {
      // Set global instance to null
      setGlobalToastInstance(null);
    });

    it('should not throw error when calling methods without global instance', () => {
      expect(() => {
        Toast.success('test message');
        Toast.error('test error');
        Toast.warning('test warning');
        Toast.info('test info');
        showToast.success('test message');
        showToast.hide();
      }).not.toThrow();
    });

    it('should gracefully handle missing global instance', () => {
      expect(() => {
        Toast.show('test message', 'success');
      }).not.toThrow();
    });
  });

  describe('setGlobalToastInstance', () => {
    it('should update the global toast instance', () => {
      const newMockInstance = {
        success: jest.fn(),
        error: jest.fn(),
        warning: jest.fn(),
        info: jest.fn(),
        dismiss: jest.fn(),
      };

      setGlobalToastInstance(newMockInstance);

      Toast.success('test with new instance');

      expect(newMockInstance.success).toHaveBeenCalledWith('test with new instance', undefined, undefined);
      expect(mockToastInstance.success).not.toHaveBeenCalled();
    });
  });
});