def multiply_matrices(a,b):
    if len(a[0]) != len(b):
        raise ValueError("Number of cols in matrix A must be equal to number of rows in matrix B")

    result = [[0 for _ in range(len(b[0]))] for _ in range(len(a))]
    
    for i in range(len(a)):
        for j in range(len(b[0])):
            for k in range(len(b)):
                result[i][j]+=a[i][k]*b[k][j]
    
    return result