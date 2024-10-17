/**
 * Accepts a FormGroup and compares it to an object to return the dirty form values
 * @param form - FormGroup
 * @param compareData - object to compare form values against
 * @returns Partial<T>
 * @example dirtyFormData<UserCreate>(this.userForm, initUser)
 */
export function dirtyFormData(form, compareData) {
    const dirtyFormData = {};
    for (const [key, control] of Object.entries(form.controls)) {
        const controlValue = control.value;
        const compareValue = compareData[key];
        if (Array.isArray(controlValue)) {
            if (!Array.isArray(compareValue)) {
                dirtyFormData[key] = controlValue;
                continue;
            }
            const diff = controlValue.filter((value) => !compareValue.includes(value));
            if (diff.length > 0) {
                dirtyFormData[key] = controlValue;
            }
            continue;
        }
        if (controlValue !== compareValue) {
            dirtyFormData[key] = controlValue;
        }
    }
    return dirtyFormData;
}
/**
 * Accepts a FormArray and removes empty strings
 * @param formArray - FormArray
 * @returns FormArray
 */
export function cleanStringFormArray(formArray) {
    for (let i = formArray.controls.length - 1; i >= 0; i--) {
        if (formArray.at(i).value === '') {
            formArray.removeAt(i);
        }
    }
    return formArray;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9ybS1oZWxwZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2NjLWxpYi9zcmMvbGliL2Zvcm1zL2Zvcm0taGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQTs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsYUFBYSxDQUFJLElBQWUsRUFBRSxXQUFjO0lBQzlELE1BQU0sYUFBYSxHQUFNLEVBQU8sQ0FBQztJQUVqQyxLQUFLLE1BQU0sQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztRQUMzRCxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ25DLE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQyxHQUFjLENBQUMsQ0FBQztRQUVqRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQztZQUNoQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDO2dCQUNqQyxhQUFhLENBQUMsR0FBYyxDQUFDLEdBQUcsWUFBMEIsQ0FBQztnQkFDM0QsU0FBUztZQUNYLENBQUM7WUFFRCxNQUFNLElBQUksR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMzRSxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQ3BCLGFBQWEsQ0FBQyxHQUFjLENBQUMsR0FBRyxZQUEwQixDQUFDO1lBQzdELENBQUM7WUFDRCxTQUFTO1FBQ1gsQ0FBQztRQUVELElBQUksWUFBWSxLQUFLLFlBQVksRUFBRSxDQUFDO1lBQ2xDLGFBQWEsQ0FBQyxHQUFjLENBQUMsR0FBRyxZQUEwQixDQUFDO1FBQzdELENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsU0FBb0I7SUFDdkQsS0FBSyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3hELElBQUksU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDakMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QixDQUFDO0lBQ0gsQ0FBQztJQUNELE9BQU8sU0FBUyxDQUFDO0FBQ25CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBGb3JtQXJyYXksIEZvcm1Hcm91cCB9IGZyb20gJ0Bhbmd1bGFyL2Zvcm1zJztcblxuLyoqXG4gKiBBY2NlcHRzIGEgRm9ybUdyb3VwIGFuZCBjb21wYXJlcyBpdCB0byBhbiBvYmplY3QgdG8gcmV0dXJuIHRoZSBkaXJ0eSBmb3JtIHZhbHVlc1xuICogQHBhcmFtIGZvcm0gLSBGb3JtR3JvdXBcbiAqIEBwYXJhbSBjb21wYXJlRGF0YSAtIG9iamVjdCB0byBjb21wYXJlIGZvcm0gdmFsdWVzIGFnYWluc3RcbiAqIEByZXR1cm5zIFBhcnRpYWw8VD5cbiAqIEBleGFtcGxlIGRpcnR5Rm9ybURhdGE8VXNlckNyZWF0ZT4odGhpcy51c2VyRm9ybSwgaW5pdFVzZXIpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJ0eUZvcm1EYXRhPFQ+KGZvcm06IEZvcm1Hcm91cCwgY29tcGFyZURhdGE6IFQpOiBUIHtcbiAgY29uc3QgZGlydHlGb3JtRGF0YTogVCA9IHt9IGFzIFQ7XG5cbiAgZm9yIChjb25zdCBba2V5LCBjb250cm9sXSBvZiBPYmplY3QuZW50cmllcyhmb3JtLmNvbnRyb2xzKSkge1xuICAgIGNvbnN0IGNvbnRyb2xWYWx1ZSA9IGNvbnRyb2wudmFsdWU7XG4gICAgY29uc3QgY29tcGFyZVZhbHVlID0gY29tcGFyZURhdGFba2V5IGFzIGtleW9mIFRdO1xuXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoY29udHJvbFZhbHVlKSkge1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGNvbXBhcmVWYWx1ZSkpIHtcbiAgICAgICAgZGlydHlGb3JtRGF0YVtrZXkgYXMga2V5b2YgVF0gPSBjb250cm9sVmFsdWUgYXMgVFtrZXlvZiBUXTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRpZmYgPSBjb250cm9sVmFsdWUuZmlsdGVyKCh2YWx1ZSkgPT4gIWNvbXBhcmVWYWx1ZS5pbmNsdWRlcyh2YWx1ZSkpO1xuICAgICAgaWYgKGRpZmYubGVuZ3RoID4gMCkge1xuICAgICAgICBkaXJ0eUZvcm1EYXRhW2tleSBhcyBrZXlvZiBUXSA9IGNvbnRyb2xWYWx1ZSBhcyBUW2tleW9mIFRdO1xuICAgICAgfVxuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGNvbnRyb2xWYWx1ZSAhPT0gY29tcGFyZVZhbHVlKSB7XG4gICAgICBkaXJ0eUZvcm1EYXRhW2tleSBhcyBrZXlvZiBUXSA9IGNvbnRyb2xWYWx1ZSBhcyBUW2tleW9mIFRdO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkaXJ0eUZvcm1EYXRhO1xufVxuXG4vKipcbiAqIEFjY2VwdHMgYSBGb3JtQXJyYXkgYW5kIHJlbW92ZXMgZW1wdHkgc3RyaW5nc1xuICogQHBhcmFtIGZvcm1BcnJheSAtIEZvcm1BcnJheVxuICogQHJldHVybnMgRm9ybUFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjbGVhblN0cmluZ0Zvcm1BcnJheShmb3JtQXJyYXk6IEZvcm1BcnJheSk6IEZvcm1BcnJheSB7XG4gIGZvciAobGV0IGkgPSBmb3JtQXJyYXkuY29udHJvbHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICBpZiAoZm9ybUFycmF5LmF0KGkpLnZhbHVlID09PSAnJykge1xuICAgICAgZm9ybUFycmF5LnJlbW92ZUF0KGkpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZm9ybUFycmF5O1xufVxuIl19